import type { AnyNode } from 'domhandler';
import type { CheerioAPI, Cheerio } from 'cheerio';
import type { QueueItem, Resolver } from '../lib/bfs.js';
import { parseAlt, extractRows, parseNumber, parsePrice, type Price } from '../lib/html.js';

const WIKI_BASE = 'https://new.mechs.su';

export type ItemSubtype =
  'pack' | 'gift' | 'energy' | 'invis' | 'repair' | 'scanner' | 'teleport' | 'upgrade';

/**
 * Стартовые страницы категорий предметов. По каждой — своя ветка BFS с
 * зашитым `subtype` в контексте (переносится на все карточки этого seed'а).
 * Корневая 3111 — только оглавление, в seeds не входит: сразу стартуем с
 * подстраниц, чтобы не тянуть 3765 «Устанавливаемые» (не относится к
 * этому каталогу) и не иметь пути без subtype.
 *
 * pack и gift разделяют CSS-класс `wiki-item-type-used-set-object` —
 * различаем ТОЛЬКО через subtype в ctx, не через CSS.
 */
const ITEM_SUBTYPE_PAGES: Array<{ page_id: number; subtype: ItemSubtype }> = [
  { page_id: 3704, subtype: 'pack' },
  { page_id: 3719, subtype: 'gift' },
  { page_id: 3779, subtype: 'energy' },
  { page_id: 3786, subtype: 'invis' },
  { page_id: 3788, subtype: 'repair' },
  { page_id: 3792, subtype: 'scanner' },
  { page_id: 3796, subtype: 'teleport' },
  { page_id: 3950, subtype: 'upgrade' }, // /wiki/modification/installation-skills — апгрейды-предметы (1-6); 7-8 через overlay Sheets
];

export interface LootDrop {
  name: string;
  count: number;
  chance?: string;
}

export interface ItemStats {
  weight: number;
  creates?: LootDrop[];
  createdIn?: LootDrop[];
  energyRestored?: number;
  energyConsumption?: number;
  healing?: number;
  repairPause?: number;
  repairPauseIfNotAttacked?: number;
  scanRadius?: number;
  duration?: number;
}

export interface Item {
  key: string;
  name: string;
  model: string;
  subtype: ItemSubtype;
  requiredLevel?: number;
  requiredRobotType?: string;
  stats: ItemStats;
  buyPrice?: Price;
  sellPrice?: Price;
  craftFromBlueprints?: string[];
  description?: string;
  iconPath?: string;
  wikiUrl?: string;
}

export interface ItemCtx {
  subtype: ItemSubtype;
}

export const itemsResolver: Resolver<Item, ItemCtx> = {
  parsePage({ $, url, ctx }): Item[] {
    const items: Item[] = [];

    $('h2.wiki-header').each((_, header) => {
      const $h = $(header);

      const $img = $h.find('img.wiki-main-icon').first();
      const alt = ($img.attr('alt') ?? '').trim();
      const iconSrc = ($img.attr('src') ?? '').trim();

      const parsed = parseAlt(alt);
      if (!parsed) return;
      const { key, name, model } = parsed;

      const $table = $h.nextAll('table.wiki-item-table').first();
      if (!$table.length) return;

      const $t = $table as unknown as Cheerio<AnyNode>;
      const rows = extractRows($, $t);
      const stats: Partial<ItemStats> = {};
      const item: Partial<Item> = {
        key,
        name,
        model,
        subtype: ctx.subtype,
      };

      for (const [label, value] of rows) {
        applyItemField(label, value, item, stats);
      }

      // «Создает» / «Находится в» — списки дропов, которые `.text()`
      // склеивает без разделителей («1115%610%710%…»). Разбираем
      // непосредственно по HTML — по каждому `<span class="wiki-inline-block">`.
      const creates = extractLootDrops($, $t, 'создает');
      if (creates.length) stats.creates = creates;
      const createdIn = extractLootDrops($, $t, 'находится в');
      if (createdIn.length) stats.createdIn = createdIn;

      if (stats.weight == null) return;

      item.stats = stats as ItemStats;
      if (iconSrc) item.iconPath = iconSrc;
      item.wikiUrl = url;
      items.push(item as Item);
    });

    return items;
  },

  extractLinks(): QueueItem<ItemCtx>[] {
    // Каждая подстраница содержит полный список своей категории.
    // Ссылки внутри ведут на другие каталоги (паки/чертежи/оружие) — не тянем.
    // Дочерних страниц по subtype нет.
    return [];
  },
};

export function itemsSeeds(): QueueItem<ItemCtx>[] {
  return ITEM_SUBTYPE_PAGES.map((p) => ({
    url: `${WIKI_BASE}/?page_id=${p.page_id}`,
    ctx: { subtype: p.subtype },
  }));
}

function applyItemField(
  label: string,
  value: string,
  item: Partial<Item>,
  stats: Partial<ItemStats>
): void {
  const lower = label.toLowerCase();

  if (lower.includes('устанавливается в слот')) {
    // Есть у нескольких subtype, но в схеме Item мы его не храним —
    // slot у used-предметов не используется в фильтрах / UI.
    return;
  } else if (lower.includes('требуемый уровень')) {
    item.requiredLevel = parseNumber(value) ?? undefined;
  } else if (lower.includes('требуемый тип робота')) {
    item.requiredRobotType = value;
  } else if (lower === 'вес') {
    stats.weight = parseNumber(value) ?? undefined;
  } else if (lower === 'создает' || lower === 'создаёт' || lower.includes('находится в')) {
    // Обрабатывается отдельно через `extractLootDrops` в parsePage —
    // `.text()` склеивает список без разделителей.
    return;
  } else if (lower.includes('восстанавливает энергии')) {
    // ДО общего «восстанавливает» — иначе перехватит.
    stats.energyRestored = parseNumber(value) ?? undefined;
  } else if (lower === 'восстанавливает' || lower.startsWith('восстанавливает ')) {
    stats.healing = parseNumber(value) ?? undefined;
  } else if (lower.includes('пауза ремонта, если не был атакован')) {
    // ДО общей «пауза ремонта» — иначе перехватит.
    stats.repairPauseIfNotAttacked = parseNumber(value) ?? undefined;
  } else if (lower.includes('пауза ремонта')) {
    stats.repairPause = parseNumber(value) ?? undefined;
  } else if (lower.includes('энергопотребление')) {
    stats.energyConsumption = parseNumber(value) ?? undefined;
  } else if (lower.includes('радиус сканирования')) {
    stats.scanRadius = parseNumber(value) ?? undefined;
  } else if (lower.includes('время действия')) {
    stats.duration = parseNumber(value) ?? undefined;
  } else if (lower.includes('цена покупки')) {
    if (/\d/.test(value)) item.buyPrice = parsePrice(value);
  } else if (lower.includes('цена продажи')) {
    item.sellPrice = parsePrice(value);
  } else if (lower.includes('крафтится') || lower.includes('чертеж')) {
    item.craftFromBlueprints = value
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
  } else if (lower === 'описание') {
    item.description = value;
  }
}

/**
 * Разбирает поля «Создает» / «Находится в» на вики: `<td.wiki-item-td2>`
 * содержит список `<span class="wiki-inline-block">`, каждый — одна
 * дроп-позиция:
 *
 *     <span class="wiki-inline-block">
 *       <a data-description="Апгрейд уровень 8">
 *         <img alt="Иконка Апгрейд уровень 8" />
 *       </a>
 *       <sub>1</sub>
 *       <sup>15%</sup>
 *     </span>
 *
 * `.text()` без разделителей склеивает всё в кашу — поэтому парсим
 * по элементам вручную. Имя предмета: `data-description` на любом
 * ancestor'е (обычно `<a>` или `<span class="wiki-tooltip">`) либо
 * `alt` из `<img>` без префикса «Иконка ».
 */
function extractLootDrops(
  $: CheerioAPI,
  $table: Cheerio<AnyNode>,
  labelSubstr: string
): LootDrop[] {
  const drops: LootDrop[] = [];
  $table.find('td.wiki-item-td1').each((_, td1) => {
    const $td1 = $(td1);
    const label = $td1.text().trim().toLowerCase();
    if (!label.includes(labelSubstr)) return;
    const $td2 = $td1.next('td.wiki-item-td2');
    $td2.find('span.wiki-inline-block').each((_, span) => {
      const $span = $(span);
      // name: data-description → у ancestor'а (<a> или <span.wiki-tooltip>),
      // fallback — <img alt> без префикса «Иконка ».
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

      const countText = $span.find('sub').first().text().trim();
      const count = parseNumber(countText) ?? 1;
      const chanceText = $span.find('sup').first().text().trim();
      const drop: LootDrop = { name, count };
      if (chanceText) drop.chance = chanceText;
      drops.push(drop);
    });
  });
  return drops;
}
