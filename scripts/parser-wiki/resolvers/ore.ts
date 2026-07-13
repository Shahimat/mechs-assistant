import type { AnyNode } from 'domhandler';
import type { CheerioAPI, Cheerio } from 'cheerio';
import type { QueueItem, Resolver } from '../lib/bfs.js';
import { parseAlt, extractRows, parseNumber, parsePrice, type Price } from '../lib/html.js';

const WIKI_BASE = 'https://new.mechs.su';
const ROOT_PAGE_ID = 3036;

export interface OreStats {
  weight: number;
}

export interface Ore {
  key: string;
  name: string;
  model: string;
  stats: OreStats;
  foundIn?: string[];
  sellPrice?: Price;
  craftFromBlueprints?: string[];
  description?: string;
  iconPath?: string;
  wikiUrl?: string;
}

export type OreCtx = Record<string, never>;

export const oreResolver: Resolver<Ore, OreCtx> = {
  parsePage({ $, url }): Ore[] {
    const ores: Ore[] = [];

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
      const stats: Partial<OreStats> = {};
      const ore: Partial<Ore> = { key, name, model };

      for (const [label, value] of rows) {
        applyOreField(label, value, ore, stats);
      }

      // «Находится в» — список `<a data-description>` подряд, без
      // разделителей в `.text()`. Разбираем по <a>-тегам.
      const foundIn = extractSourceNames($, $t, 'находится в');
      if (foundIn.length) ore.foundIn = foundIn;

      if (stats.weight == null) return;

      ore.stats = stats as OreStats;
      if (iconSrc) ore.iconPath = iconSrc;
      ore.wikiUrl = url;
      ores.push(ore as Ore);
    });

    return ores;
  },

  extractLinks(): QueueItem<OreCtx>[] {
    // Одна страница 3036 содержит все руды. Дочерних не тянем.
    return [];
  },
};

export function oreSeeds(): QueueItem<OreCtx>[] {
  return [{ url: `${WIKI_BASE}/?page_id=${ROOT_PAGE_ID}`, ctx: {} }];
}

function applyOreField(
  label: string,
  value: string,
  ore: Partial<Ore>,
  stats: Partial<OreStats>
): void {
  const lower = label.toLowerCase();

  if (lower === 'вес') {
    stats.weight = parseNumber(value) ?? undefined;
  } else if (lower.includes('находится в')) {
    // Обрабатывается отдельно через `extractSourceNames` в parsePage —
    // `.text()` склеивает список без разделителей.
    return;
  } else if (lower.includes('цена покупки')) {
    if (/\d/.test(value)) ore.sellPrice = parsePrice(value);
  } else if (lower.includes('цена продажи')) {
    ore.sellPrice = parsePrice(value);
  } else if (lower.includes('крафтится') || lower.includes('чертеж')) {
    ore.craftFromBlueprints = value
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
  } else if (lower === 'описание') {
    ore.description = value;
  }
}

/**
 * Разбирает поле «Находится в» на вики: `<td.wiki-item-td2>` содержит
 * список `<a data-description="…">` подряд, без `<span class="wiki-inline-block">`
 * и без `<sub>/<sup>` (в отличие от items.stats.creates — там сложная
 * разметка с количеством и шансом). У руд только имя источника.
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
    // Прямые <a> с data-description — предпочтительно (даёт очищенное имя).
    $td2.find('a[data-description], span[data-description]').each((_, el) => {
      const raw = $(el).attr('data-description');
      if (!raw) return;
      const n = raw.trim();
      if (!n || seen.has(n)) return;
      seen.add(n);
      names.push(n);
    });
    // Fallback: если у элемента нет data-description — берём <img alt>
    // без префикса «Иконка ».
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
