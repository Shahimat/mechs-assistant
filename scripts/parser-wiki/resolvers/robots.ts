import type { AnyNode } from 'domhandler';
import type { QueueItem, Resolver } from '../lib/bfs.js';
import { parseAlt, extractRows, parseNumber, parsePrice, type Price } from '../lib/html.js';

export type MechType = 'боец' | 'транспортник' | 'добытчик' | 'разведчик';

export const WIKI_BASE = 'https://new.mechs.su';

/**
 * Стартовые страницы классов роботов. По каждой — своя ветка BFS с зашитым
 * `type` в контексте (переносится на все связанные подстраницы мехов
 * этого класса).
 */
export const MECH_CLASS_PAGES: Array<{ page_id: number; type: MechType }> = [
  { page_id: 3301, type: 'боец' },
  { page_id: 3088, type: 'транспортник' },
  { page_id: 3099, type: 'добытчик' },
  { page_id: 3102, type: 'разведчик' },
];

/**
 * Известные справочные page_id (валюты, термины, страницы-классы) — по ним
 * не идём. Классы обрабатываем отдельно через стартовую очередь.
 */
const REFERENCE_PAGE_IDS = new Set([
  3017, // Боны
  3020, // Реглы
  3493, // Цена покупки/продажи (общая справка)
  2875, // Требуемый уровень персонажа
  2882, // Тип робота
]);

export interface RobotStats {
  durability: number;
  capacity: number;
  maxCapacity?: number;
  speed: number;
  maxSpeed: number;
  armor: number;
  energyFields: number;
  regenerationPerMinute?: number;
  additionalInvulnerability?: number;
  additionalAcceleration?: number;
}

export interface Robot {
  key: string;
  name: string;
  model: string;
  type: MechType;
  requiredLevel?: number;
  stats: RobotStats;
  buyPrice?: Price;
  sellPrice?: Price;
  upgradePrice?: Price;
  upgradeReglPercent?: number;
  itemUpgradePercent?: number;
  extraSlots?: string[];
  features?: string[];
  backSideDamage?: number;
  howitzerDamage?: number;
  missChance?: number;
  iconPath?: string;
  wikiUrl?: string;
}

export interface RobotCtx {
  type: MechType;
}

export const robotsResolver: Resolver<Robot, RobotCtx> = {
  parsePage({ $, url, ctx }): Robot[] {
    const robots: Robot[] = [];

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

      const rows = extractRows($, $table as unknown as import('cheerio').Cheerio<AnyNode>);
      const stats: Partial<RobotStats> = {};
      const robot: Partial<Robot> = { key, name, model, type: ctx.type };

      for (const [label, value] of rows) {
        applyRobotField(label, value, robot, stats);
      }

      if (
        stats.durability == null ||
        stats.capacity == null ||
        stats.speed == null ||
        stats.maxSpeed == null ||
        stats.armor == null ||
        stats.energyFields == null
      ) {
        return;
      }

      // Fallback: если requiredLevel не был явно указан в таблице,
      // берём первое число из имени меха ("Гарпий 1" → 1, "Кондор 100 М" → 100).
      if (robot.requiredLevel == null) {
        const nameLevelMatch = /\b(\d+)\b/.exec(name);
        if (nameLevelMatch) {
          robot.requiredLevel = Number(nameLevelMatch[1]);
        }
      }

      robot.stats = stats as RobotStats;
      if (iconSrc) robot.iconPath = iconSrc;
      robot.wikiUrl = url;
      robots.push(robot as Robot);
    });

    return robots;
  },

  extractLinks({ $, url, ctx }): QueueItem<RobotCtx>[] {
    const classPageIds = new Set(MECH_CLASS_PAGES.map((c) => c.page_id));
    const out: QueueItem<RobotCtx>[] = [];
    const seen = new Set<string>();

    $('.entry-content h2 a[href]').each((_, a) => {
      let href = ($(a).attr('href') ?? '').trim();
      if (!href) return;

      // Обрезаем hash — «/?page_id=21034#strizh» ведёт на реальную
      // страницу-со-многими-мехами, hash только скролит к секции.
      const hashIdx = href.indexOf('#');
      if (hashIdx >= 0) href = href.slice(0, hashIdx);
      if (!href) return;

      if (href.startsWith('/')) href = WIKI_BASE + href;
      if (!href.startsWith(WIKI_BASE)) return;
      if (href === url) return;

      const pageIdMatch = /[?&]page_id=(\d+)/.exec(href);
      const isSlug = /\/wiki\/robots\//.test(href);
      if (!pageIdMatch && !isSlug) return;

      if (pageIdMatch) {
        const pid = Number(pageIdMatch[1]);
        if (REFERENCE_PAGE_IDS.has(pid)) return;
        if (classPageIds.has(pid)) return; // класс-страницу уже обрабатывает стартовая очередь
      }

      if (seen.has(href)) return;
      seen.add(href);
      out.push({ url: href, ctx });
    });

    return out;
  },
};

export function robotsSeeds(): QueueItem<RobotCtx>[] {
  return MECH_CLASS_PAGES.map((c) => ({
    url: `${WIKI_BASE}/?page_id=${c.page_id}`,
    ctx: { type: c.type },
  }));
}

function applyRobotField(
  label: string,
  value: string,
  robot: Partial<Robot>,
  stats: Partial<RobotStats>
): void {
  const lower = label.toLowerCase();

  if (lower.includes('прочность')) stats.durability = parseNumber(value) ?? undefined;
  else if (
    lower.includes('максимальная вместимость') ||
    lower.includes('вместимость max') ||
    lower.includes('макс. вместимость')
  )
    stats.maxCapacity = parseNumber(value) ?? undefined;
  else if (lower === 'вместимость' || lower.startsWith('вместимость '))
    stats.capacity = parseNumber(value) ?? undefined;
  else if (
    lower.includes('скорость max') ||
    lower.includes('макс. скорость') ||
    lower.includes('максимальная скорость')
  )
    stats.maxSpeed = parseNumber(value) ?? undefined;
  else if (lower === 'скорость' || lower.startsWith('скорость '))
    stats.speed = parseNumber(value) ?? undefined;
  else if (lower === 'броня') stats.armor = parseNumber(value) ?? undefined;
  else if (lower === 'поля') stats.energyFields = parseNumber(value) ?? undefined;
  else if (lower.includes('восстановление'))
    stats.regenerationPerMinute = parseNumber(value) ?? undefined;
  else if (lower.includes('неуязвимость'))
    stats.additionalInvulnerability = parseNumber(value) ?? undefined;
  else if (lower.includes('ускорение'))
    stats.additionalAcceleration = parseNumber(value) ?? undefined;
  else if (lower.includes('требуемый уровень'))
    robot.requiredLevel = parseNumber(value) ?? undefined;
  else if (lower.includes('цена покупки')) robot.buyPrice = parsePrice(value);
  else if (lower.includes('цена продажи')) robot.sellPrice = parsePrice(value);
  else if (lower.includes('цена для прокачки') || lower.includes('цена прокачки'))
    robot.upgradePrice = parsePrice(value);
  else if (lower.includes('прокачка (реглы') || lower.includes('прокачка реглы'))
    robot.upgradeReglPercent = parseNumber(value) ?? undefined;
  else if (lower.includes('прокачка предметов'))
    robot.itemUpgradePercent = parseNumber(value) ?? undefined;
  else if (lower.includes('дополнительные слоты') || lower.includes('доп. слоты'))
    robot.extraSlots = value
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
  else if (lower.includes('особенности'))
    robot.features = value
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
  else if (lower.includes('урон в спину') || lower.includes('урон в бок'))
    robot.backSideDamage = parseNumber(value) ?? undefined;
  else if (lower.includes('урон от гаубиц')) robot.howitzerDamage = parseNumber(value) ?? undefined;
  else if (lower.includes('вероятность промаха'))
    robot.missChance = parseNumber(value) ?? undefined;
}
