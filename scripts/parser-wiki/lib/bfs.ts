import { load as cheerioLoad } from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import { fetchText, sleep } from './fetch.js';

/**
 * Один элемент очереди BFS-обхода вики. `ctx` — произвольная payload-структура
 * резолвера (например, для мехов — `type: 'боец'`; для weapons —
 * может быть пустой).
 */
export interface QueueItem<Ctx> {
  url: string;
  ctx: Ctx;
}

/**
 * Резолвер каталога — набор колбэков, которые описывают,
 *   1) как парсить одну страницу в T-записи,
 *   2) какие ссылки со страницы класть в очередь дальше.
 * Общий движок (`runBfs`) знает всё про очередь/visited/задержку.
 */
export interface Resolver<T, Ctx> {
  /** Что парсим на текущей странице → массив записей. */
  parsePage(args: { $: CheerioAPI; url: string; ctx: Ctx }): T[];
  /** Какие URL со страницы кладём в очередь (с новым ctx). */
  extractLinks(args: { $: CheerioAPI; url: string; ctx: Ctx }): QueueItem<Ctx>[];
  /**
   * Опциональный post-BFS hook. Вызывается один раз после обхода всех
   * seed'ов, до записи parsed JSON. Позволяет резолверу дозаполнить
   * записи из статичного источника, если fetch страниц провалился
   * (напр. 404 на seed → parsePage не вызвался → потеря записей).
   * Возвращает финальный массив (может добавлять, мержить, оставлять
   * как есть).
   */
  hydrate?(entries: T[]): T[];
}

/**
 * Обход очереди с visited-dedup и вежливой задержкой.
 * Возвращает массив уникальных T-записей (dedup по entry.key).
 */
export async function runBfs<T extends { key: string }, Ctx>(
  seeds: QueueItem<Ctx>[],
  resolver: Resolver<T, Ctx>,
  opts: { fetchDelayMs: number }
): Promise<T[]> {
  const queue: QueueItem<Ctx>[] = [...seeds];
  const visitedUrls = new Set<string>();
  const seenKeys = new Set<string>();
  const entries: T[] = [];

  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) break;
    if (visitedUrls.has(item.url)) continue;
    visitedUrls.add(item.url);

    let html: string;
    try {
      html = await fetchText(item.url);
    } catch (err) {
      console.warn(`  fetch fail ${item.url}: ${(err as Error).message}`);
      continue;
    }
    const $ = cheerioLoad(html);

    const parsed = resolver.parsePage({ $, url: item.url, ctx: item.ctx });
    let added = 0;
    for (const entry of parsed) {
      if (seenKeys.has(entry.key)) continue;
      seenKeys.add(entry.key);
      entries.push(entry);
      added++;
    }
    console.log(`  ${item.url} → +${added}, total ${entries.length}`);

    const links = resolver.extractLinks({ $, url: item.url, ctx: item.ctx });
    for (const link of links) {
      if (!visitedUrls.has(link.url)) queue.push(link);
    }

    await sleep(opts.fetchDelayMs);
  }

  return resolver.hydrate ? resolver.hydrate(entries) : entries;
}
