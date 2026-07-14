import type { AnyNode } from 'domhandler';
import type { CheerioAPI, Cheerio } from 'cheerio';
import type { QueueItem, Resolver } from '../lib/bfs.js';
import { parseAlt, extractRows, parseNumber, parsePrice, type Price } from '../lib/html.js';

const WIKI_BASE = 'https://new.mechs.su';

export type LootSource = 'monster' | 'mole' | 'pirate';

/**
 * Стартовые страницы источников лута. По каждой — своя ветка BFS с
 * зашитым `source` в контексте (тот же паттерн, что у `robots` с
 * `MechType` и `items` с `ItemCtx.subtype`).
 */
const LOOT_SOURCE_PAGES: Array<{ page_id: number; source: LootSource }> = [
  { page_id: 3023, source: 'monster' },
  { page_id: 3027, source: 'mole' },
  { page_id: 20118, source: 'pirate' },
];

export interface LootStats {
  weight: number;
}

export interface Loot {
  key: string;
  name: string;
  model: string;
  sources: LootSource[];
  stats: LootStats;
  foundIn?: string[];
  sellPrice?: Price;
  description?: string;
  iconPath?: string;
  wikiUrl?: string;
}

export interface LootCtx {
  source: LootSource;
}

export const lootResolver: Resolver<Loot, LootCtx> = {
  parsePage({ $, url, ctx }): Loot[] {
    const items: Loot[] = [];

    $('h2.wiki-header').each((_, header) => {
      const $h = $(header);
      const classes = ($h.attr('class') ?? '').split(/\s+/);
      if (!classes.includes('wiki-item-type-cargo')) return;

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
      const stats: Partial<LootStats> = {};
      const loot: Partial<Loot> = {
        key,
        name,
        model,
        sources: [ctx.source],
      };

      for (const [label, value] of rows) {
        applyLootField(label, value, loot, stats);
      }

      // «Находится в» — список `<a data-description>` подряд, без
      // разделителей в `.text()`. Разбираем по <a>-тегам (та же логика,
      // что для ore.foundIn / components.craftFromBlueprints).
      const foundIn = extractSourceNames($, $t, 'находится в');
      if (foundIn.length) loot.foundIn = foundIn;

      if (stats.weight == null) return;

      loot.stats = stats as LootStats;
      if (iconSrc) loot.iconPath = iconSrc;
      loot.wikiUrl = url;
      items.push(loot as Loot);
    });

    return items;
  },

  extractLinks(): QueueItem<LootCtx>[] {
    // Каждая страница содержит полный список своего источника; дочерних
    // не тянем.
    return [];
  },
};

export function lootSeeds(): QueueItem<LootCtx>[] {
  return LOOT_SOURCE_PAGES.map((p) => ({
    url: `${WIKI_BASE}/?page_id=${p.page_id}`,
    ctx: { source: p.source },
  }));
}

function applyLootField(
  label: string,
  value: string,
  loot: Partial<Loot>,
  stats: Partial<LootStats>
): void {
  const lower = label.toLowerCase();

  if (lower === 'вес') {
    stats.weight = parseNumber(value) ?? undefined;
  } else if (lower.includes('находится в')) {
    // Обрабатывается отдельно через `extractSourceNames` в parsePage.
    return;
  } else if (lower.includes('цена покупки')) {
    if (/\d/.test(value)) loot.sellPrice = parsePrice(value);
  } else if (lower.includes('цена продажи')) {
    loot.sellPrice = parsePrice(value);
  } else if (lower === 'описание') {
    loot.description = value;
  }
}

/**
 * Разбирает поле-список `<a data-description>` внутри td (по образцу
 * `extractSourceNames` из ore/components-резолверов).
 */
function extractSourceNames(
  $: CheerioAPI,
  $table: Cheerio<AnyNode>,
  labelSubstr: string
): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  $table.find('td.wiki-item-td1').each((_, td1) => {
    const $td1 = $(td1);
    const label = $td1.text().trim().toLowerCase();
    if (!label.includes(labelSubstr)) return;
    const $td2 = $td1.next('td.wiki-item-td2');
    $td2.find('a[data-description], span[data-description]').each((_, el) => {
      const raw = $(el).attr('data-description');
      if (!raw) return;
      const n = raw.trim();
      if (!n || seen.has(n)) return;
      seen.add(n);
      names.push(n);
    });
    if (names.length === 0) {
      $td2.find('img').each((_, img) => {
        const alt = $(img).attr('alt') ?? '';
        const n = alt.replace(/^Иконка\s+/i, '').trim();
        if (!n || seen.has(n)) return;
        seen.add(n);
        names.push(n);
      });
    }
  });
  return names;
}
