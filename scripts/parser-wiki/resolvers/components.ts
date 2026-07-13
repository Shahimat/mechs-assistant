import type { AnyNode } from 'domhandler';
import type { CheerioAPI, Cheerio } from 'cheerio';
import type { QueueItem, Resolver } from '../lib/bfs.js';
import { parseAlt, extractRows, parseNumber, parsePrice, type Price } from '../lib/html.js';

const WIKI_BASE = 'https://new.mechs.su';
const ROOT_PAGE_ID = 3955;

export interface ComponentStats {
  weight: number;
}

export interface Component {
  key: string;
  name: string;
  model: string;
  stats: ComponentStats;
  craftFromBlueprints?: string[];
  sellPrice?: Price;
  description?: string;
  iconPath?: string;
  wikiUrl?: string;
}

export type ComponentCtx = Record<string, never>;

export const componentsResolver: Resolver<Component, ComponentCtx> = {
  parsePage({ $, url }): Component[] {
    const components: Component[] = [];

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
      const stats: Partial<ComponentStats> = {};
      const component: Partial<Component> = { key, name, model };

      for (const [label, value] of rows) {
        applyComponentField(label, value, component, stats);
      }

      // «Крафтится из чертежей» — список `<a data-description>` подряд, без
      // `<span>/<sub>/<sup>`. `.text()` склеивает без разделителей, поэтому
      // разбираем по <a>-тегам (тот же паттерн, что для `ore.foundIn`).
      const blueprints = extractSourceNames($, $t, 'крафтится');
      if (blueprints.length) component.craftFromBlueprints = blueprints;

      if (stats.weight == null) return;

      component.stats = stats as ComponentStats;
      if (iconSrc) component.iconPath = iconSrc;
      component.wikiUrl = url;
      components.push(component as Component);
    });

    return components;
  },

  extractLinks(): QueueItem<ComponentCtx>[] {
    return [];
  },
};

export function componentsSeeds(): QueueItem<ComponentCtx>[] {
  return [{ url: `${WIKI_BASE}/?page_id=${ROOT_PAGE_ID}`, ctx: {} }];
}

function applyComponentField(
  label: string,
  value: string,
  component: Partial<Component>,
  stats: Partial<ComponentStats>
): void {
  const lower = label.toLowerCase();

  if (lower === 'вес') {
    stats.weight = parseNumber(value) ?? undefined;
  } else if (lower.includes('крафтится') || lower.includes('чертеж')) {
    // Обрабатывается отдельно через `extractSourceNames` в parsePage —
    // `.text()` склеивает без разделителей.
    return;
  } else if (lower.includes('цена покупки')) {
    if (/\d/.test(value)) component.sellPrice = parsePrice(value);
  } else if (lower.includes('цена продажи')) {
    component.sellPrice = parsePrice(value);
  } else if (lower === 'описание') {
    component.description = value;
  }
}

/**
 * Разбирает поле-список `<a data-description>` внутри td (по образцу
 * `extractSourceNames` из ore-резолвера). Возвращает уникальные имена
 * из атрибута `data-description` элементов внутри td2 напротив td1
 * с искомой подстрокой label.
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
