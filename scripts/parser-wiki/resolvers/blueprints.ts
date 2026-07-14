import type { AnyNode } from 'domhandler';
import type { CheerioAPI, Cheerio } from 'cheerio';
import type { QueueItem, Resolver } from '../lib/bfs.js';
import { parseAlt, extractRows, parseNumber, parsePrice, type Price } from '../lib/html.js';
import { translit } from '../translit.js';

const WIKI_BASE = 'https://new.mechs.su';

/**
 * Seed page_id → category+subtype для чертежа. У всех записей на всех
 * страницах одинаковый CSS-класс `wiki-item-type-design`, поэтому
 * категория определяется по URL целевой страницы чертежа в h2 (см.
 * `resolveCategoryFromDesignHref`) — эти seed'ы — точки входа BFS.
 */
const BLUEPRINT_SEEDS: number[] = [
  4029, // Оружие (weapon)
  3066, // Трюм (equipment/cargo)
  3069, // Чипы (equipment/computer)
  3071, // Броня (equipment/armour)
  3073, // Защитное поле (equipment/shield)
  3075, // Компоненты (component)
  3077, // Паки (pack)
  3080, // Апгрейды (upgrade)
  3083, // Телепорты (teleport)
];

export type BlueprintCategory =
  'mech' | 'weapon' | 'equipment' | 'component' | 'pack' | 'upgrade' | 'teleport';

export interface BlueprintIngredient {
  key: string;
  catalog?: string;
  count: number;
}

export interface BlueprintStats {
  durability: number;
}

export interface Blueprint {
  key: string;
  name: string;
  model: string;
  category: BlueprintCategory;
  subtype?: string;
  producesKey: string;
  producesCatalog?: string;
  output: number;
  ingredients: BlueprintIngredient[];
  skillSpecialist?: number;
  bondsCost?: number;
  reglsCost?: number;
  stats: BlueprintStats;
  sellPrice?: Price;
  description?: string;
  iconPath?: string;
  wikiUrl?: string;
}

export type BlueprintCtx = Record<string, never>;

export const blueprintsResolver: Resolver<Blueprint, BlueprintCtx> = {
  parsePage({ $, url }): Blueprint[] {
    const out: Blueprint[] = [];

    $('h2.wiki-header.wiki-item-type-design').each((_, header) => {
      const $h = $(header);

      const $img = $h.find('img.wiki-main-icon').first();
      const alt = ($img.attr('alt') ?? '').trim();
      const iconSrc = ($img.attr('src') ?? '').trim();

      const parsed = parseAlt(alt);
      if (!parsed) return;
      const { key, name } = parsed;

      // «Модель» у чертежа — базовое имя цели без числового суффикса
      // («Чертеж Пулемёт 6Б» → model «Чертеж Пулемёт»). Даёт группировку
      // в UI по цели.
      const modelRaw = name.replace(/\s+\d+.*$/, '').trim() || name;

      const $link = $h.find('a[href]').first();
      const designHref = ($link.attr('href') ?? '').trim();
      const catInfo = resolveCategoryFromDesignHref(designHref);
      if (!catInfo) return;

      const $table = $h.nextAll('table.wiki-item-table').first();
      if (!$table.length) return;

      const $t = $table as unknown as Cheerio<AnyNode>;
      const bp: Partial<Blueprint> = {
        key,
        name,
        model: modelRaw,
        category: catInfo.category,
      };
      if (catInfo.subtype) bp.subtype = catInfo.subtype;

      const produces = extractProduces($, $t);
      if (!produces) return;
      bp.producesKey = produces.key;
      bp.output = produces.output;
      if (produces.catalog) bp.producesCatalog = produces.catalog;

      // Паки с производимым мехом (data-description «Робот X» → key
      // `robot_x`) семантически — не расходники, а сборочный чертёж
      // корпуса. Перекрашиваем в отдельную категорию `mech` и правим
      // producesCatalog на `robots`, чтобы UI-lookup имени пошёл в
      // правильный каталог.
      if (bp.category === 'pack' && bp.producesKey.startsWith('robot_')) {
        bp.category = 'mech';
        bp.producesCatalog = 'robots';
      }

      const req = extractRequirements($, $t);
      bp.ingredients = req.ingredients;
      if (req.skillSpecialist != null) bp.skillSpecialist = req.skillSpecialist;
      if (req.bondsCost != null) bp.bondsCost = req.bondsCost;
      if (req.reglsCost != null) bp.reglsCost = req.reglsCost;

      const stats: Partial<BlueprintStats> = {};
      const rows = extractRows($, $t);
      for (const [label, value] of rows) {
        applyBlueprintField(label, value, bp, stats);
      }
      if (stats.durability == null) return;
      bp.stats = stats as BlueprintStats;

      if (iconSrc) bp.iconPath = iconSrc;
      bp.wikiUrl = url;
      out.push(bp as Blueprint);
    });

    return out;
  },

  extractLinks(): QueueItem<BlueprintCtx>[] {
    // Все чертежи — на 9 seed'ах, дальше не ходим.
    return [];
  },
};

export function blueprintsSeeds(): QueueItem<BlueprintCtx>[] {
  return BLUEPRINT_SEEDS.map((pid) => ({
    url: `${WIKI_BASE}/?page_id=${pid}`,
    ctx: {},
  }));
}

function applyBlueprintField(
  label: string,
  value: string,
  bp: Partial<Blueprint>,
  stats: Partial<BlueprintStats>
): void {
  const lower = label.toLowerCase();
  if (lower.includes('износостойкость') || lower.includes('прочность')) {
    stats.durability = parseNumber(value) ?? undefined;
  } else if (lower.includes('цена продажи')) {
    bp.sellPrice = parsePrice(value);
  } else if (lower === 'описание') {
    bp.description = value;
  }
  // «Создает» и «Для создания требуется» — обрабатываются отдельно
  // (extractProduces / extractRequirements): span'ы с иконкой и <sub>
  // тегом склеиваются в `.text()` и теряют структуру.
}

/**
 * Определяет category+subtype чертежа по URL целевой страницы чертежа
 * в h2 (`/wiki/economy/design/<slug>[/<sub>]#...`). CSS-класс на h2
 * у всех чертежей одинаковый — `wiki-item-type-design`, поэтому URL —
 * единственный сигнал.
 */
function resolveCategoryFromDesignHref(
  href: string
): { category: BlueprintCategory; subtype?: string } | null {
  const m = /\/wiki\/economy\/design\/([^/#?]+)(?:\/([^/#?]+))?/.exec(href);
  if (!m) return null;
  const seg1 = m[1];
  const seg2 = m[2];

  if (seg1 === 'equipment') {
    if (seg2 === 'weapon') return { category: 'weapon' };
    if (seg2 === 'drawing-hold') return { category: 'equipment', subtype: 'cargo' };
    if (seg2 === 'drawing-chip') return { category: 'equipment', subtype: 'computer' };
    if (seg2 === 'drawing-armor') return { category: 'equipment', subtype: 'armour' };
    if (seg2 === 'drawing-field') return { category: 'equipment', subtype: 'shield' };
    return { category: 'equipment' };
  }
  if (seg1 === 'components') return { category: 'component' };
  if (seg1 === 'drawings-packs') return { category: 'pack' };
  if (seg1 === 'drawings-upgrades') return { category: 'upgrade' };
  if (seg1 === 'drawings-tp') return { category: 'teleport' };
  return null;
}

/**
 * Строка «Создает»: единственный span.wiki-inline-block с <a
 * data-description="<цель>"> и <sub>N</sub>. Возвращает
 * producesKey (translit цели), output (N) и catalog (по href).
 */
function extractProduces(
  $: CheerioAPI,
  $table: Cheerio<AnyNode>
): { key: string; output: number; catalog?: string } | null {
  let result: { key: string; output: number; catalog?: string } | null = null;
  $table.find('td.wiki-item-td1').each((_, td1) => {
    if (result) return;
    const $td1 = $(td1);
    const label = $td1.text().trim().toLowerCase();
    if (label !== 'создает') return;
    const $td2 = $td1.next('td.wiki-item-td2');
    const $span = $td2.find('span.wiki-inline-block').first();
    if (!$span.length) return;

    const $a = $span.find('a[data-description]').first();
    const name = ($a.attr('data-description') ?? '').trim();
    if (!name) return;
    const key = translit(name);
    if (!key) return;

    const href = ($a.attr('href') ?? '').trim();
    const catalog = inferCatalogFromHref(href);
    const count = parseNumber($span.find('sub').first().text().trim()) ?? 1;
    result = { key, output: count };
    if (catalog) result.catalog = catalog;
  });
  return result;
}

/**
 * Строка «Для создания требуется»: два <p> в td2.
 *   Первый — ингредиенты: span.wiki-inline-block с <a
 *   data-description="<имя>"> и <sub>N</sub> (href → catalog).
 *   Второй — требования: span.wiki-inline-block без <sub> с текстом
 *   «Навык специалист: N», «Боны: N», «Реглы: N».
 */
function extractRequirements(
  $: CheerioAPI,
  $table: Cheerio<AnyNode>
): {
  ingredients: BlueprintIngredient[];
  skillSpecialist?: number;
  bondsCost?: number;
  reglsCost?: number;
} {
  const ingredients: BlueprintIngredient[] = [];
  let skillSpecialist: number | undefined;
  let bondsCost: number | undefined;
  let reglsCost: number | undefined;

  $table.find('td.wiki-item-td1').each((_, td1) => {
    const $td1 = $(td1);
    const label = $td1.text().trim().toLowerCase();
    if (!label.includes('для создания требуется')) return;
    const $td2 = $td1.next('td.wiki-item-td2');

    $td2.find('span.wiki-inline-block').each((_, span) => {
      const $span = $(span);
      const $sub = $span.find('sub').first();
      if ($sub.length) {
        const $a = $span.find('a[data-description]').first();
        const name = ($a.attr('data-description') ?? '').trim();
        if (!name) return;
        const key = translit(name);
        if (!key) return;
        const count = parseNumber($sub.text().trim()) ?? 1;
        const catalog = inferCatalogFromHref(($a.attr('href') ?? '').trim());
        const ing: BlueprintIngredient = { key, count };
        if (catalog) ing.catalog = catalog;
        ingredients.push(ing);
      } else {
        const text = $span.text().trim();
        const mSkill = /Навык\s+специалист[^\d]*(\d+(?:[.,]\d+)?)/i.exec(text);
        if (mSkill) skillSpecialist = Number(mSkill[1].replace(',', '.'));
        const mBonds = /Боны[^\d]*(\d+(?:[.,]\d+)?)/i.exec(text);
        if (mBonds) bondsCost = Number(mBonds[1].replace(',', '.'));
        const mRegls = /Реглы[^\d]*(\d+(?:[.,]\d+)?)/i.exec(text);
        if (mRegls) reglsCost = Number(mRegls[1].replace(',', '.'));
      }
    });
  });

  const res: {
    ingredients: BlueprintIngredient[];
    skillSpecialist?: number;
    bondsCost?: number;
    reglsCost?: number;
  } = { ingredients };
  if (skillSpecialist != null) res.skillSpecialist = skillSpecialist;
  if (bondsCost != null) res.bondsCost = bondsCost;
  if (reglsCost != null) res.reglsCost = reglsCost;
  return res;
}

/**
 * Определяет slug каталога по URL ингредиента/цели. Соответствует
 * структуре путей вики Мехи.Земля.
 */
function inferCatalogFromHref(href: string): string | undefined {
  if (!href) return undefined;
  if (/\/wiki\/economy\/components/.test(href)) return 'components';
  if (/\/wiki\/economy\/loot-/.test(href)) return 'loot';
  if (/\/wiki\/items\/weapons\//.test(href)) return 'weapons';
  if (/\/wiki\/items\/additional-equipment\//.test(href)) return 'equipment';
  if (/\/wiki\/items\/chips\b/.test(href)) return 'equipment';
  if (/\/wiki\/items\/protection\//.test(href)) return 'equipment';
  if (/\/wiki\/items\/used\//.test(href)) return 'items';
  if (/\/wiki\/items\/ores\//.test(href)) return 'ore';
  if (/\/wiki\/modification\/installation-skills/.test(href)) return 'items';
  return undefined;
}
