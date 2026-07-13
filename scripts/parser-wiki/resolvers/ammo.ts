import type { AnyNode } from 'domhandler';
import type { QueueItem, Resolver } from '../lib/bfs.js';
import { parseAlt, extractRows, parseNumber, parsePrice, type Price } from '../lib/html.js';

const WIKI_BASE = 'https://new.mechs.su';
const ROOT_PAGE_ID = 3661; // «Боезапас» — единственная страница, все карточки здесь

/**
 * Маппинг человекочитаемых лейблов оружия из вики на CSS-slug `Weapon.category`.
 * Ключи — normalized (lowercase, ё→е). Используется:
 *   1) для извлечения `family` из первого фрагмента `name` (сортируем ключи по
 *      длине, ищем самый длинный префикс).
 *   2) для маппинга каждого `<a>`-тега из поля «Группа орудий» в CSS-slug.
 * Значения синхронизированы с CSS-slug'ами `Weapon.category` в `weapons.ts`.
 */
const LABEL_TO_CATEGORY: Record<string, string> = {
  'пулемет крупнокалиберный': 'bullet-heavy',
  'пулемет энрг': 'bullet-eng',
  пулемет: 'bullet',
  'пушка энрг': 'missile-eng',
  пушка: 'missile',
  мортира: 'mortar',
  'гаубица энрг': 'howitzer-eng',
  гаубица: 'howitzer',
  'гранатомет энрг': 'launcher-eng',
  гранатомет: 'launcher',
  'рк энрг': 'rk-eng',
  'рк общий': 'rk',
  рк: 'rk',
  фазер: 'faser',
  эмпп: 'empp',
  'запчасти улучшенные': 'repair',
  запчасти: 'repair',
};

/** Отсортировано по убыванию длины — при поиске префикса «Пулемёт крупнокалиберный»
 *  не должен коротко смэтчиться на «Пулемёт». */
const LABEL_KEYS_BY_LENGTH = Object.keys(LABEL_TO_CATEGORY).sort((a, b) => b.length - a.length);

function normalize(s: string): string {
  return s.toLowerCase().replace(/ё/g, 'е').trim();
}

function findFamilyPrefix(name: string): { family: string; model: string } | null {
  const n = normalize(name);
  for (const key of LABEL_KEYS_BY_LENGTH) {
    if (n === key || n.startsWith(key + ' ')) {
      // Модель — оригинальные первые слова name с сохранением регистра/ё.
      const wordCount = key.split(' ').length;
      const model = name.split(/\s+/).slice(0, wordCount).join(' ');
      return { family: LABEL_TO_CATEGORY[key], model };
    }
  }
  return null;
}

function categoryFromLabel(label: string): string | null {
  const n = normalize(label);
  return LABEL_TO_CATEGORY[n] ?? null;
}

export interface AmmoStats {
  rounds: number;
  weight: number;
}

export interface Ammo {
  key: string;
  name: string;
  model: string;
  family: string;
  compatibleCategories: string[];
  slot?: string;
  requiredLevel?: number;
  stats: AmmoStats;
  buyPrice?: Price;
  sellPrice?: Price;
  description?: string;
  iconPath?: string;
  wikiUrl?: string;
}

export type AmmoCtx = Record<string, never>;

export const ammoResolver: Resolver<Ammo, AmmoCtx> = {
  parsePage({ $, url }): Ammo[] {
    const items: Ammo[] = [];

    $('h2.wiki-header').each((_, header) => {
      const $h = $(header);
      const classes = ($h.attr('class') ?? '').split(/\s+/);
      // На странице ~3661 все карточки — wiki-item-type-bullet. Компактные превью
      // помечены дополнительным wiki-item-m; полагаемся на dedup через seenKeys
      // в BFS (по одной записи на key).
      if (!classes.includes('wiki-item-type-bullet')) return;

      const $img = $h.find('img.wiki-main-icon').first();
      const alt = ($img.attr('alt') ?? '').trim();
      const iconSrc = ($img.attr('src') ?? '').trim();

      const parsed = parseAlt(alt);
      if (!parsed) return;
      const { key, name } = parsed;

      const family = findFamilyPrefix(name);
      if (!family) return; // непонятная семья — не пропускаем в JSON

      const $table = $h.nextAll('table.wiki-item-table').first();
      if (!$table.length) return;

      const rows = extractRows($, $table as unknown as import('cheerio').Cheerio<AnyNode>);
      const stats: Partial<AmmoStats> = {};
      const item: Partial<Ammo> = {
        key,
        name,
        model: family.model,
        family: family.family,
        compatibleCategories: [family.family],
      };

      for (const [label, value] of rows) {
        applyAmmoField(label, value, item, stats);
      }

      // «Группа орудий» — несколько <a> в одном td, .text() склеивает
      // («ПулеметПушка»). Собираем каждый <a> отдельно (тот же приём, что
      // в weapons resolver), маппим в CSS-slug'и.
      $table.find('td.wiki-item-td1').each((_, td1) => {
        const label = $(td1).text().trim().toLowerCase();
        if (!label.includes('группа орудий')) return;
        const $td2 = $(td1).next('td.wiki-item-td2');
        const slugs: string[] = [];
        $td2.find('a').each((_, a) => {
          const txt = $(a).text().trim();
          if (!txt) return;
          const slug = categoryFromLabel(txt);
          if (slug && !slugs.includes(slug)) slugs.push(slug);
        });
        if (slugs.length) item.compatibleCategories = slugs;
      });

      if (stats.rounds == null || stats.weight == null) return;

      // Fallback: если requiredLevel не был явно указан, берём первое число
      // из имени («Пулемёт +25» → 25, «Гранатомет +40 М1» → 40). Пропускаем
      // строку «Стандарт» — там числа нет.
      if (item.requiredLevel == null) {
        const nameLevelMatch = /\b(\d+)\b/.exec(name);
        if (nameLevelMatch) {
          item.requiredLevel = Number(nameLevelMatch[1]);
        }
      }

      // powerBonus из description: «+N мощности» → N; «стандартной мощности» → 0.
      if (item.description) {
        const bonusMatch = /\+(\d+)\s*мощности/.exec(item.description);
        if (bonusMatch) {
          item.powerBonus = Number(bonusMatch[1]);
        } else if (/стандартной\s+мощности/.test(item.description)) {
          item.powerBonus = 0;
        }
      }

      item.stats = stats as AmmoStats;
      if (iconSrc) item.iconPath = iconSrc;
      item.wikiUrl = url;
      items.push(item as Ammo);
    });

    return items;
  },

  extractLinks(): QueueItem<AmmoCtx>[] {
    // На странице 3661 полный список ammo, дочерних страниц нет.
    // Ссылки внутри ведут на страницы weapons/справочники — не тянем.
    return [];
  },
};

export function ammoSeeds(): QueueItem<AmmoCtx>[] {
  return [{ url: `${WIKI_BASE}/?page_id=${ROOT_PAGE_ID}`, ctx: {} }];
}

function applyAmmoField(
  label: string,
  value: string,
  item: Partial<Ammo>,
  stats: Partial<AmmoStats>
): void {
  const lower = label.toLowerCase();

  if (lower.includes('устанавливается в слот')) item.slot = value;
  else if (lower.includes('требуемый уровень'))
    item.requiredLevel = parseNumber(value) ?? undefined;
  else if (
    // Поле боезапаса называется по-разному у разных типов оружия:
    // «Патроны»/«Патроны Энерг» — пулемёт, «Снаряды»/«Снаряды Энерг» —
    // пушка/мортира/гаубица, «Ракеты» — гранатомет/РК, «Плазма заряды» —
    // фазер/эмпп, «Запчасти» — ремпушки. Все они семантически = rounds.
    lower === 'патроны' ||
    lower.startsWith('патроны ') ||
    lower === 'снаряды' ||
    lower.startsWith('снаряды ') ||
    lower === 'ракеты' ||
    lower === 'плазма заряды' ||
    lower === 'запчасти'
  )
    stats.rounds = parseNumber(value) ?? undefined;
  else if (lower === 'вес') stats.weight = parseNumber(value) ?? undefined;
  else if (lower.includes('цена покупки')) {
    if (/\d/.test(value)) item.buyPrice = parsePrice(value);
  } else if (lower.includes('цена продажи')) item.sellPrice = parsePrice(value);
  else if (lower === 'описание') item.description = value;
  // «Группа орудий» обрабатывается отдельно в parsePage — по <a>-тегам,
  // не через плоский extractRows.
}
