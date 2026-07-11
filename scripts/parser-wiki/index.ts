import { load as cheerioLoad } from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  MECH_CLASS_PAGES,
  WIKI_BASE,
  ROBOTS_JSON_PATH,
  ICONS_DIR,
  FETCH_DELAY_MS,
  type MechClassPage,
} from './config.js';
import { translit } from './translit.js';
import { convertToWebp } from '../convert-to-webp/index.js';

type Price = { bonds?: number; regls?: number };
type RobotStats = {
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
};
type Robot = {
  key: string;
  name: string;
  model: string;
  type: MechClassPage['type'];
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
};

/**
 * Известные справочные page_id (валюты, термины, страницы-классы) — по ним
 * не идём. Классы обрабатываем отдельно через MECH_CLASS_PAGES.
 */
const REFERENCE_PAGE_IDS = new Set([
  3017, // Боны
  3020, // Реглы
  3493, // Цена покупки/продажи (общая справка)
  2875, // Требуемый уровень персонажа
  2882, // Тип робота
]);

async function main() {
  await fs.mkdir(ICONS_DIR, { recursive: true });

  const robots: Robot[] = [];
  const seenKeys = new Set<string>();
  const visitedUrls = new Set<string>();
  const classPageIds = new Set(MECH_CLASS_PAGES.map((c) => c.page_id));

  type QueueItem = { url: string; type: MechClassPage['type'] };
  const queue: QueueItem[] = MECH_CLASS_PAGES.map((c) => ({
    url: `${WIKI_BASE}/?page_id=${c.page_id}`,
    type: c.type,
  }));

  while (queue.length > 0) {
    const { url, type } = queue.shift()!;
    if (visitedUrls.has(url)) continue;
    visitedUrls.add(url);

    let html: string;
    try {
      html = await fetchText(url);
    } catch (err) {
      console.warn(`  fetch fail ${url}: ${(err as Error).message}`);
      continue;
    }
    const $ = cheerioLoad(html);

    const parsed = parsePageForRobots($, type, url);
    let added = 0;
    for (const robot of parsed) {
      if (seenKeys.has(robot.key)) continue;
      seenKeys.add(robot.key);
      robots.push(robot);
      added++;
    }
    console.log(`  ${url} → +${added}, total ${robots.length}`);

    const linkedUrls = extractMechLinks($, url, classPageIds);
    for (const linkUrl of linkedUrls) {
      if (!visitedUrls.has(linkUrl)) queue.push({ url: linkUrl, type });
    }
    await sleep(FETCH_DELAY_MS);
  }

  const downloadedIcons: string[] = [];
  for (const robot of robots) {
    if (!robot.iconPath) continue;
    const iconUrl = robot.iconPath;
    const iconFile = path.join(ICONS_DIR, `${robot.key}.png`);
    try {
      await downloadFile(iconUrl, iconFile);
      robot.iconPath = iconFile;
      downloadedIcons.push(iconFile);
    } catch (err) {
      console.warn(`  icon fail for ${robot.key}: ${(err as Error).message}`);
      delete robot.iconPath;
    }
  }

  if (downloadedIcons.length > 0) {
    console.log(`converting ${downloadedIcons.length} icons to WebP...`);
    // resizeTo: 128 — умеренный Lanczos3-upscale маленьких иконок
    // (обычно 64×64) до 128×128. Больше не даёт видимого прироста
    // качества, но раздувает файлы.
    // lossy quality: 90 — визуально неотличимо от lossless для иконок,
    // но 2-3× меньше размер.
    const convertResults = await convertToWebp(downloadedIcons, {
      resizeTo: 128,
      lossless: false,
      quality: 90,
    });
    const pngToWebp = new Map<string, string>();
    let totalIn = 0;
    let totalOut = 0;
    for (const r of convertResults) {
      if (r.error) {
        console.warn(`  convert fail: ${r.input}: ${r.error}`);
      } else {
        pngToWebp.set(r.input, r.output);
        totalIn += r.originalSize;
        totalOut += r.newSize;
      }
    }
    for (const robot of robots) {
      if (robot.iconPath && pngToWebp.has(robot.iconPath)) {
        robot.iconPath = pngToWebp.get(robot.iconPath)!;
      }
    }
    const savedPct = totalIn > 0 ? Math.round(((totalIn - totalOut) / totalIn) * 100) : 0;
    console.log(`  ${pngToWebp.size} converted, ${totalIn}→${totalOut} B (-${savedPct}%)`);
  }

  robots.sort((a, b) => a.key.localeCompare(b.key));
  await fs.writeFile(ROBOTS_JSON_PATH, JSON.stringify(robots, null, 2) + '\n', 'utf-8');
  console.log(`✓ wrote ${robots.length} robots to ${ROBOTS_JSON_PATH}`);
}

function parsePageForRobots(
  $: CheerioAPI,
  type: MechClassPage['type'],
  wikiUrl: string
): Robot[] {
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

    const rows = extractRows($, $table);
    const stats: Partial<RobotStats> = {};
    const robot: Partial<Robot> = { key, name, model, type };

    for (const [label, value] of rows) {
      applyField(label, value, robot, stats);
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
    robot.wikiUrl = wikiUrl;
    robots.push(robot as Robot);
  });

  return robots;
}

function extractMechLinks(
  $: CheerioAPI,
  currentUrl: string,
  classPageIds: Set<number>
): string[] {
  const out: string[] = [];
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
    if (href === currentUrl) return;

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
    out.push(href);
  });
  return out;
}

/**
 * "Иконка ГАРПИЙ 1"        → key=garpiy_1,    name=Гарпий 1,    model=Гарпий
 * "Иконка КАЗУАР"          → key=kazuar,      name=Казуар,      model=Казуар
 * "Иконка АЭРО ТЯГАЧ 80 М" → key=aero_tyagach_80_m, name=Аэро Тягач 80 М, model=Аэро Тягач
 * "Иконка ТЕРАТОРН удален" → null (пропускаем удалённых)
 */
function parseAlt(
  alt: string
): { key: string; name: string; model: string } | null {
  const m = /^Иконка\s+(.+?)\s*$/i.exec(alt);
  if (!m) return null;
  const title = m[1].trim();
  if (/удал[её]н[оа]?/i.test(title)) return null;

  const name = toTitleCase(title);
  const modelRaw = title.replace(/\s+\d+.*$/, '').trim() || title;
  const model = toTitleCase(modelRaw);
  const key = translit(title);
  return { key, name, model };
}

function toTitleCase(input: string): string {
  return input
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function extractRows($: CheerioAPI, $table: cheerio.Cheerio<any>): Array<[string, string]> {
  const rows: Array<[string, string]> = [];
  $table.find('tr').each((_, tr) => {
    const $tr = $(tr);
    const label = $tr.find('td.wiki-item-td1').first().text().replace(/\s+/g, ' ').trim();
    const value = $tr.find('td.wiki-item-td2').first().text().replace(/\s+/g, ' ').trim();
    if (label) rows.push([label, value]);
  });
  return rows;
}

function applyField(
  label: string,
  value: string,
  robot: Partial<Robot>,
  stats: Partial<RobotStats>
): void {
  const lower = label.toLowerCase();
  const num = (v: string): number | null => {
    const cleaned = v.replace(/[^\d.,+-]/g, '').replace(',', '.');
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  };
  const parsePrice = (v: string): Price => {
    const price: Price = {};
    const bonds = /Бон[ыа]?\s*:?\s*([\d.,]+)/i.exec(v);
    const regls = /Регл[ыа]?\s*:?\s*([\d.,]+)/i.exec(v);
    if (bonds) price.bonds = Number(bonds[1].replace(',', '.'));
    if (regls) price.regls = Number(regls[1].replace(',', '.'));
    return price;
  };

  if (lower.includes('прочность')) stats.durability = num(value) ?? undefined;
  else if (
    lower.includes('максимальная вместимость') ||
    lower.includes('вместимость max') ||
    lower.includes('макс. вместимость')
  )
    stats.maxCapacity = num(value) ?? undefined;
  else if (lower === 'вместимость' || lower.startsWith('вместимость '))
    stats.capacity = num(value) ?? undefined;
  else if (
    lower.includes('скорость max') ||
    lower.includes('макс. скорость') ||
    lower.includes('максимальная скорость')
  )
    stats.maxSpeed = num(value) ?? undefined;
  else if (lower === 'скорость' || lower.startsWith('скорость '))
    stats.speed = num(value) ?? undefined;
  else if (lower === 'броня') stats.armor = num(value) ?? undefined;
  else if (lower === 'поля') stats.energyFields = num(value) ?? undefined;
  else if (lower.includes('восстановление')) stats.regenerationPerMinute = num(value) ?? undefined;
  else if (lower.includes('неуязвимость'))
    stats.additionalInvulnerability = num(value) ?? undefined;
  else if (lower.includes('ускорение')) stats.additionalAcceleration = num(value) ?? undefined;
  else if (lower.includes('требуемый уровень')) robot.requiredLevel = num(value) ?? undefined;
  else if (lower.includes('цена покупки')) robot.buyPrice = parsePrice(value);
  else if (lower.includes('цена продажи')) robot.sellPrice = parsePrice(value);
  else if (lower.includes('цена для прокачки') || lower.includes('цена прокачки'))
    robot.upgradePrice = parsePrice(value);
  else if (lower.includes('прокачка (реглы') || lower.includes('прокачка реглы'))
    robot.upgradeReglPercent = num(value) ?? undefined;
  else if (lower.includes('прокачка предметов'))
    robot.itemUpgradePercent = num(value) ?? undefined;
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
    robot.backSideDamage = num(value) ?? undefined;
  else if (lower.includes('урон от гаубиц')) robot.howitzerDamage = num(value) ?? undefined;
  else if (lower.includes('вероятность промаха')) robot.missChance = num(value) ?? undefined;
}

async function fetchText(url: string): Promise<string> {
  // ?PageSpeed=off отключает mod_pagespeed lazy-load, иначе img src идёт
  // как placeholder /pagespeed_static/*.gif и раскрывается только в браузере.
  const withNoOptim = url + (url.includes('?') ? '&' : '?') + 'PageSpeed=off';
  const res = await fetch(withNoOptim, { headers: { 'User-Agent': 'mechs-assistant-parser/0.1' } });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return res.text();
}

async function downloadFile(url: string, dest: string): Promise<void> {
  const res = await fetch(url, { headers: { 'User-Agent': 'mechs-assistant-parser/0.1' } });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, buf);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((err) => {
  console.error('sync:wiki failed:', err.message);
  process.exit(1);
});
