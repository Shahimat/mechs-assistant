import type { AnyNode } from 'domhandler';
import type { CheerioAPI, Cheerio } from 'cheerio';
import type { QueueItem, Resolver } from '../lib/bfs.js';
import { parseAlt, extractRows, parseNumber, parsePrice, type Price } from '../lib/html.js';
import { translit } from '../translit.js';

const WIKI_BASE = 'https://new.mechs.su';
const ROOT_PAGE_ID = 3341; // «Вооружение» — оглавление

/**
 * Известные справочные / соседние page_id, по которым не ходим.
 * Список пополняется, если BFS начнёт скакать не туда.
 */
const REFERENCE_PAGE_IDS = new Set([
  2875, // Требуемый уровень персонажа
  2882, // Тип робота
  2902, // Навыки персонажа
  3017, // Боны
  3020, // Реглы
  3088, // Транспортник (мех-класс)
  3099, // Добытчик
  3102, // Разведчик
  3301, // Боец (мех-класс)
  3341, // Root вооружения — стартовая, dedup всё равно не даст пойти
  3493, // Цена покупки/продажи
  3528, // Завод (модификация)
]);

export interface WeaponStats {
  damageMin: number;
  damageMax: number;
  range: number;
  energyConsumption: number;
  rateOfFire: number;
  durability: number;
  weight: number;
  ammo?: number;
  minRange?: number;
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

export interface Weapon {
  key: string;
  name: string;
  model: string;
  category: string;
  group?: string;
  slot?: string;
  requiredLevel?: number;
  stats: WeaponStats;
  buyPrice?: Price;
  sellPrice?: Price;
  craftFromBlueprints?: string[];
  description?: string;
  iconPath?: string;
  wikiUrl?: string;
  transformsFrom?: Transform;
}

/** Пустой контекст — категорию берём из CSS-класса на месте. */
export type WeaponCtx = Record<string, never>;

export const weaponsResolver: Resolver<Weapon, WeaponCtx> = {
  parsePage({ $, url }): Weapon[] {
    const weapons: Weapon[] = [];

    $('h2.wiki-header').each((_, header) => {
      const $h = $(header);
      const classes = ($h.attr('class') ?? '').split(/\s+/);
      const isWeapon = classes.includes('wiki-item-type-weapon');
      if (!isWeapon) return;

      const categoryClass = classes.find((c) => c.startsWith('wiki-item-weapon-'));
      const category = categoryClass ? categoryClass.replace('wiki-item-weapon-', '') : 'unknown';

      const $img = $h.find('img.wiki-main-icon').first();
      const alt = ($img.attr('alt') ?? '').trim();
      const iconSrc = ($img.attr('src') ?? '').trim();

      const parsed = parseAlt(alt);
      if (!parsed) return;
      const { key, name, model } = parsed;

      const $table = $h.nextAll('table.wiki-item-table').first();
      if (!$table.length) return;

      const rows = extractRows($, $table as unknown as import('cheerio').Cheerio<AnyNode>);
      const stats: Partial<WeaponStats> = {};
      const weapon: Partial<Weapon> = { key, name, model, category };

      for (const [label, value] of rows) {
        applyWeaponField(label, value, weapon, stats);
      }

      // «Группа орудий» в вики оформлена несколькими <a> внутри одной
      // ячейки без разделителя — `.text()` их склеивает («ПулеметПушка»).
      // Перечитываем такую ячейку прицельно: собираем каждый <a> отдельно.
      $table.find('td.wiki-item-td1').each((_, td1) => {
        const label = $(td1).text().trim().toLowerCase();
        if (!label.includes('группа орудий')) return;
        const $td2 = $(td1).next('td.wiki-item-td2');
        const parts: string[] = [];
        $td2.find('a').each((_, a) => {
          const t = $(a).text().trim();
          if (t) parts.push(t);
        });
        if (parts.length) weapon.group = parts.join(', ');
      });

      // Требуем набор ключевых полей для валидности.
      if (
        stats.damageMin == null ||
        stats.damageMax == null ||
        stats.range == null ||
        stats.durability == null ||
        stats.weight == null
      ) {
        return;
      }
      // rateOfFire / energyConsumption у некоторых оружий может отсутствовать —
      // подставим 0, чтобы удовлетворить required-типизацию, но фактически
      // это сигнал «нет данных».
      if (stats.rateOfFire == null) stats.rateOfFire = 0;
      if (stats.energyConsumption == null) stats.energyConsumption = 0;

      // Fallback: если requiredLevel не был явно указан в таблице,
      // берём первое число из имени оружия ("Пушка 12Б" → 12).
      if (weapon.requiredLevel == null) {
        const nameLevelMatch = /\b(\d+)\b/.exec(name);
        if (nameLevelMatch) {
          weapon.requiredLevel = Number(nameLevelMatch[1]);
        }
      }

      // «Преобразуется из» + «Для преобразования требуется» — цепочка
      // трансформации. td1 склеен из двух меток, второй `<a data-description>`
      // указывает на предыдущий weapon (первый — tooltip-help); td2 содержит
      // ингредиенты (span'ы с иконкой + <sub>) и цену (Боны/Реглы).
      const transform = extractTransform($, $table as unknown as Cheerio<AnyNode>);
      if (transform) weapon.transformsFrom = transform;

      weapon.stats = stats as WeaponStats;
      if (iconSrc) weapon.iconPath = iconSrc;
      weapon.wikiUrl = url;
      weapons.push(weapon as Weapon);
    });

    return weapons;
  },

  extractLinks({ $, url }): QueueItem<WeaponCtx>[] {
    const out: QueueItem<WeaponCtx>[] = [];
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
      if (!pageIdMatch) return; // берём только явные page_id
      const pid = Number(pageIdMatch[1]);
      if (REFERENCE_PAGE_IDS.has(pid)) return;

      if (seen.has(href)) return;
      seen.add(href);
      out.push({ url: href, ctx: {} });
    });

    return out;
  },
};

export function weaponsSeeds(): QueueItem<WeaponCtx>[] {
  return [{ url: `${WIKI_BASE}/?page_id=${ROOT_PAGE_ID}`, ctx: {} }];
}

function applyWeaponField(
  label: string,
  value: string,
  weapon: Partial<Weapon>,
  stats: Partial<WeaponStats>
): void {
  const lower = label.toLowerCase();

  if (lower.includes('устанавливается в слот')) weapon.slot = value;
  else if (lower.includes('группа орудий')) weapon.group = value;
  else if (
    lower === 'удар' ||
    lower === 'урон' ||
    lower.startsWith('удар ') || // «Удар Энерг» у лазеров
    lower === 'ремонт' // ремонтные пушки — эффект восстановления HP
  ) {
    const range = parseDamageRange(value);
    if (range) {
      stats.damageMin = range[0];
      stats.damageMax = range[1];
    }
  } else if (lower === 'дальность') stats.range = parseNumber(value) ?? undefined;
  else if (lower.includes('минимальная зона') || lower.includes('мертвая зона'))
    stats.minRange = parseNumber(value) ?? undefined;
  else if (lower.includes('энергопотребление'))
    stats.energyConsumption = parseNumber(value) ?? undefined;
  else if (lower.includes('скорострельность')) stats.rateOfFire = parseNumber(value) ?? undefined;
  else if (
    lower === 'снаряды' ||
    lower.startsWith('снаряды') ||
    lower === 'запчасти' // ремпушки — расход запчастей вместо боезапаса
  )
    stats.ammo = parseNumber(value) ?? undefined;
  else if (lower.includes('прочность')) stats.durability = parseNumber(value) ?? undefined;
  else if (lower === 'вес') stats.weight = parseNumber(value) ?? undefined;
  else if (lower.includes('требуемый уровень'))
    weapon.requiredLevel = parseNumber(value) ?? undefined;
  else if (lower.includes('цена покупки')) {
    // «в магазинах не продается» — оставляем buyPrice undefined
    if (/\d/.test(value)) weapon.buyPrice = parsePrice(value);
  } else if (lower.includes('цена продажи')) weapon.sellPrice = parsePrice(value);
  else if (lower.includes('крафтится') || lower.includes('чертеж'))
    weapon.craftFromBlueprints = value
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
  else if (lower === 'описание') weapon.description = value;
}

/**
 * Парсит диапазон урона: "263 - 290" → [263, 290]. Одиночное число
 * ("42") → [42, 42].
 */
function parseDamageRange(v: string): [number, number] | null {
  const m = /(\d+(?:[.,]\d+)?)\s*[-–—]\s*(\d+(?:[.,]\d+)?)/.exec(v);
  if (m) {
    return [Number(m[1].replace(',', '.')), Number(m[2].replace(',', '.'))];
  }
  const single = parseNumber(v);
  if (single != null) return [single, single];
  return null;
}

/**
 * Извлекает трансформацию weapon из склеенной ячейки «Преобразуется из /
 * Для преобразования требуется». В td1 второй `<a data-description>` —
 * предыдущий weapon (первый — tooltip-help). В td2:
 *   - span'ы с иконкой + <sub>N</sub> — ингредиенты (translit
 *     data-description → key);
 *   - span'ы без <sub> с текстом «Боны: N» / «Реглы: N» — стоимость.
 */
function extractTransform($: CheerioAPI, $table: Cheerio<AnyNode>): Transform | null {
  let result: Transform | null = null;
  $table.find('td.wiki-item-td1').each((_, td1) => {
    const $td1 = $(td1);
    const label = $td1.text().trim().toLowerCase();
    if (!label.includes('преобразуется из')) return;

    // fromKey: второй data-description (первый — tooltip)
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
        // ингредиент: имя из data-description
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
        // требование: «Боны: N» / «Реглы: N»
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
