import type { AnyNode } from 'domhandler';
import type { CheerioAPI, Cheerio } from 'cheerio';
import type { QueueItem, Resolver } from '../lib/bfs.js';
import { parseAlt, extractRows, parseNumber, parsePrice, type Price } from '../lib/html.js';
import { translit } from '../translit.js';

const WIKI_BASE = 'https://new.mechs.su';

/**
 * Корневые страницы каталога оборудования. По каждой стартует ветка BFS.
 *   - 3682/3106/3108 — оглавления, отдают ссылки на подстраницы конкретных подтипов.
 *   - 3657 — сразу карточки чипов, ссылок вниз почти нет.
 * Далее BFS доходит до фактических страниц:
 *   3687 (буры), 3693 (трюма), 3334 (накопители), 3336 (реакторы),
 *   3330 (броня), 3364 (энергощиты).
 */
const ROOT_PAGE_IDS = [3682, 3657, 3106, 3108];

/**
 * Справочные / соседние page_id, по которым не ходим. Родные root-страницы
 * оборудования здесь не перечислены — они посещаются штатно через seeds.
 */
const REFERENCE_PAGE_IDS = new Set([
  2875, // Требуемый уровень персонажа
  2882, // Тип робота
  2902, // Навыки персонажа
  3017, // Боны
  3020, // Реглы
  3088, // Транспортник
  3099, // Добытчик (ссылка из «Требуемый тип робота» у буров)
  3102, // Разведчик
  3301, // Боец
  3341, // Вооружение — соседний корень
  3493, // Цена покупки/продажи
  3528, // Завод (модификация)
]);

export type EquipmentFamily = 'electronic' | 'special' | 'energy' | 'defence';

export type EquipmentSubtype =
  'computer' | 'extractor' | 'cargo' | 'accumulator' | 'generator' | 'armour' | 'shield';

interface SubtypeSpec {
  family: EquipmentFamily;
  subtype: EquipmentSubtype;
  /** Точная строка label из вики (lowercase), которая даёт primary. Null — у чипов. */
  primaryLabel: string | null;
  /** Человекочитаемая подпись для UI/JSON. */
  primaryLabelRu: string | null;
}

const SUBTYPE_BY_SLUG: Record<string, SubtypeSpec> = {
  'electronic-computer': {
    family: 'electronic',
    subtype: 'computer',
    primaryLabel: null,
    primaryLabelRu: null,
  },
  'special-extractor': {
    family: 'special',
    subtype: 'extractor',
    primaryLabel: 'мощность подъема',
    primaryLabelRu: 'Мощность подъема',
  },
  'special-cargo': {
    family: 'special',
    subtype: 'cargo',
    primaryLabel: 'трюм',
    primaryLabelRu: 'Трюм',
  },
  'energy-accumulator': {
    family: 'energy',
    subtype: 'accumulator',
    primaryLabel: 'емкость',
    primaryLabelRu: 'Емкость',
  },
  'energy-generator': {
    family: 'energy',
    subtype: 'generator',
    primaryLabel: 'мощность',
    primaryLabelRu: 'Мощность',
  },
  'defence-armour': {
    family: 'defence',
    subtype: 'armour',
    primaryLabel: 'броня',
    primaryLabelRu: 'Броня',
  },
  'defence-shield': {
    family: 'defence',
    subtype: 'shield',
    primaryLabel: 'мощность поля',
    primaryLabelRu: 'Мощность поля',
  },
};

export interface EquipmentStats {
  durability: number;
  weight: number;
  primary?: number;
  primaryLabel?: string;
}

export interface TransformIngredient {
  key: string;
  count: number;
}

export interface Transform {
  fromKey: string;
  ingredients: TransformIngredient[];
  bondsCost?: number;
  reglsCost?: number;
}

export interface Equipment {
  key: string;
  name: string;
  model: string;
  family: EquipmentFamily;
  subtype: EquipmentSubtype;
  slot?: string;
  requiredLevel?: number;
  requiredRobotType?: string;
  stats: EquipmentStats;
  buyPrice?: Price;
  sellPrice?: Price;
  craftFromBlueprints?: string[];
  description?: string;
  iconPath?: string;
  wikiUrl?: string;
  transformsFrom?: Transform;
}

export type EquipmentCtx = Record<string, never>;

export const equipmentResolver: Resolver<Equipment, EquipmentCtx> = {
  parsePage({ $, url }): Equipment[] {
    const items: Equipment[] = [];

    $('h2.wiki-header').each((_, header) => {
      const $h = $(header);
      const classes = ($h.attr('class') ?? '').split(/\s+/);

      const typeClass = classes.find((c) => c.startsWith('wiki-item-type-'));
      if (!typeClass) return;
      const slug = typeClass.replace('wiki-item-type-', '');
      const spec = SUBTYPE_BY_SLUG[slug];
      if (!spec) return;

      const $img = $h.find('img.wiki-main-icon').first();
      const alt = ($img.attr('alt') ?? '').trim();
      const iconSrc = ($img.attr('src') ?? '').trim();

      const parsed = parseAlt(alt);
      if (!parsed) return;
      const { key, name, model } = parsed;

      const $table = $h.nextAll('table.wiki-item-table').first();
      if (!$table.length) return;

      const rows = extractRows($, $table as unknown as import('cheerio').Cheerio<AnyNode>);
      const stats: Partial<EquipmentStats> = {};
      const item: Partial<Equipment> = {
        key,
        name,
        model,
        family: spec.family,
        subtype: spec.subtype,
      };

      for (const [label, value] of rows) {
        applyEquipmentField(label, value, item, stats, spec);
      }

      if (stats.durability == null || stats.weight == null) {
        return;
      }

      // Fallback: если requiredLevel не был явно указан в таблице,
      // берём первое число из имени («Чип ЭНЕРГОСНАБЖЕНИЕ 5» → 5).
      if (item.requiredLevel == null) {
        const nameLevelMatch = /\b(\d+)\b/.exec(name);
        if (nameLevelMatch) {
          item.requiredLevel = Number(nameLevelMatch[1]);
        }
      }

      // «Преобразуется из» + «Для преобразования требуется» — цепочка
      // трансформации. Есть у большинства armour/accumulator/generator/
      // shield/cargo (частично) и одного computer; у extractor нет.
      const transform = extractTransform($, $table as unknown as Cheerio<AnyNode>);
      if (transform) item.transformsFrom = transform;

      item.stats = stats as EquipmentStats;
      if (iconSrc) item.iconPath = iconSrc;
      item.wikiUrl = url;
      items.push(item as Equipment);
    });

    return items;
  },

  extractLinks({ $, url }): QueueItem<EquipmentCtx>[] {
    const out: QueueItem<EquipmentCtx>[] = [];
    const seen = new Set<string>();

    $('.entry-content a[href]').each((_, a) => {
      let href = ($(a).attr('href') ?? '').trim();
      if (!href) return;

      const hashIdx = href.indexOf('#');
      if (hashIdx >= 0) href = href.slice(0, hashIdx);
      if (!href) return;

      if (href.startsWith('/')) href = WIKI_BASE + href;
      if (!href.startsWith(WIKI_BASE)) return;
      if (href === url) return;

      const pageIdMatch = /[?&]page_id=(\d+)/.exec(href);
      if (!pageIdMatch) return;
      const pid = Number(pageIdMatch[1]);
      if (REFERENCE_PAGE_IDS.has(pid)) return;

      if (seen.has(href)) return;
      seen.add(href);
      out.push({ url: href, ctx: {} });
    });

    return out;
  },
};

export function equipmentSeeds(): QueueItem<EquipmentCtx>[] {
  return ROOT_PAGE_IDS.map((pid) => ({ url: `${WIKI_BASE}/?page_id=${pid}`, ctx: {} }));
}

function applyEquipmentField(
  label: string,
  value: string,
  item: Partial<Equipment>,
  stats: Partial<EquipmentStats>,
  spec: SubtypeSpec
): void {
  const lower = label.toLowerCase();

  if (lower.includes('устанавливается в слот')) item.slot = value;
  else if (lower.includes('требуемый уровень'))
    item.requiredLevel = parseNumber(value) ?? undefined;
  else if (lower.includes('требуемый тип робота')) item.requiredRobotType = value;
  else if (lower === 'прочность') stats.durability = parseNumber(value) ?? undefined;
  else if (lower === 'вес') stats.weight = parseNumber(value) ?? undefined;
  else if (spec.primaryLabel && lower === spec.primaryLabel) {
    stats.primary = parseNumber(value) ?? undefined;
    if (spec.primaryLabelRu) stats.primaryLabel = spec.primaryLabelRu;
  } else if (lower.includes('цена покупки')) {
    if (/\d/.test(value)) item.buyPrice = parsePrice(value);
  } else if (lower.includes('цена продажи')) item.sellPrice = parsePrice(value);
  else if (lower.includes('крафтится') || lower.includes('чертеж'))
    item.craftFromBlueprints = value
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
  else if (lower === 'описание') item.description = value;
}

/**
 * Извлекает трансформацию equipment из склеенной ячейки «Преобразуется из /
 * Для преобразования требуется». Логика та же, что в weapons-резолвере:
 * второй `<a data-description>` в td1 → fromKey; span'ы в td2 с `<sub>` →
 * ингредиенты (translit data-description); span'ы без `<sub>` с текстом
 * «Боны: N» / «Реглы: N» → стоимость.
 */
function extractTransform($: CheerioAPI, $table: Cheerio<AnyNode>): Transform | null {
  let result: Transform | null = null;
  $table.find('td.wiki-item-td1').each((_, td1) => {
    const $td1 = $(td1);
    const label = $td1.text().trim().toLowerCase();
    if (!label.includes('преобразуется из')) return;

    const dds: string[] = [];
    $td1.find('[data-description]').each((_, el) => {
      const d = $(el).attr('data-description');
      if (d) dds.push(d.trim());
    });
    if (dds.length < 2) return;
    const fromKey = translit(dds[1]);
    if (!fromKey) return;

    const $td2 = $td1.next('td.wiki-item-td2');
    const ingredients: TransformIngredient[] = [];
    let bondsCost: number | undefined;
    let reglsCost: number | undefined;

    $td2.find('span.wiki-inline-block').each((_, span) => {
      const $span = $(span);
      const $sub = $span.find('sub').first();
      if ($sub.length) {
        let name = '';
        $span.find('[data-description]').each((_, el) => {
          const d = $(el).attr('data-description');
          if (d && !name) name = d.trim();
        });
        if (!name) {
          const alt = $span.find('img').first().attr('alt') ?? '';
          name = alt.replace(/^Иконка\s+/i, '').trim();
        }
        if (!name) return;
        const key = translit(name);
        if (!key) return;
        const count = parseNumber($sub.text().trim()) ?? 1;
        ingredients.push({ key, count });
      } else {
        const text = $span.text().trim();
        const mBonds = /Боны[^\d]*(\d+(?:[.,]\d+)?)/i.exec(text);
        if (mBonds) bondsCost = Number(mBonds[1].replace(',', '.'));
        const mRegls = /Реглы[^\d]*(\d+(?:[.,]\d+)?)/i.exec(text);
        if (mRegls) reglsCost = Number(mRegls[1].replace(',', '.'));
      }
    });

    result = { fromKey, ingredients };
    if (bondsCost != null) result.bondsCost = bondsCost;
    if (reglsCost != null) result.reglsCost = reglsCost;
  });
  return result;
}
