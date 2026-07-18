import type { Recognized } from '../types';

/**
 * Сливает массив страниц (каждая — список Recognized) в единый список
 * с суммированием count по одинаковым item_key. Confidence берётся
 * максимальный из встреченных, catalog — первый непустой.
 *
 * Дедуп идёт по key `${catalog ?? '_'}:${item_key}` — записи из разных
 * каталогов с одинаковым item_key не сольются (защита от коллизий
 * translit'а между каталогами).
 */
export function mergeSeries(pages: Recognized[][]): Recognized[] {
  const merged = new Map<string, Recognized>();

  for (const page of pages) {
    for (const item of page) {
      const key = `${item.catalog ?? '_'}:${item.item_key}`;
      const existing = merged.get(key);
      if (existing) {
        existing.count += item.count;
        existing.confidence = Math.max(existing.confidence, item.confidence);
        if (!existing.catalog && item.catalog) existing.catalog = item.catalog;
      } else {
        merged.set(key, { ...item });
      }
    }
  }

  return Array.from(merged.values()).sort((a, b) => b.count - a.count);
}
