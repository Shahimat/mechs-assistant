import type { CheerioAPI, Cheerio } from 'cheerio';
import type { AnyNode } from 'domhandler';
import { translit } from '../translit.js';

/**
 * "Иконка ГАРПИЙ 1"        → key=garpiy_1,    name=Гарпий 1,    model=Гарпий
 * "Иконка КАЗУАР"          → key=kazuar,      name=Казуар,      model=Казуар
 * "Иконка АЭРО ТЯГАЧ 80 М" → key=aero_tyagach_80_m, name=Аэро Тягач 80 М, model=Аэро Тягач
 * "Иконка ТЕРАТОРН удален" → null (пропускаем удалённых)
 */
export function parseAlt(alt: string): { key: string; name: string; model: string } | null {
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

export function toTitleCase(input: string): string {
  return input
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/**
 * Читает пары {label, value} из строк таблицы `wiki-item-table`
 * (столбец td.wiki-item-td1 → label, td.wiki-item-td2 → value).
 */
export function extractRows($: CheerioAPI, $table: Cheerio<AnyNode>): Array<[string, string]> {
  const rows: Array<[string, string]> = [];
  $table.find('tr').each((_, tr) => {
    const $tr = $(tr);
    const label = $tr.find('td.wiki-item-td1').first().text().replace(/\s+/g, ' ').trim();
    const value = $tr.find('td.wiki-item-td2').first().text().replace(/\s+/g, ' ').trim();
    if (label) rows.push([label, value]);
  });
  return rows;
}

/** Универсальные парсеры числовых значений и валют для applyField-резолверов. */

export interface Price {
  bonds?: number;
  regls?: number;
}

export function parseNumber(v: string): number | null {
  const cleaned = v.replace(/[^\d.,+-]/g, '').replace(',', '.');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function parsePrice(v: string): Price {
  const price: Price = {};
  const bonds = /Бон[ыа]?\s*:?\s*([\d.,]+)/i.exec(v);
  const regls = /Регл[ыа]?\s*:?\s*([\d.,]+)/i.exec(v);
  if (bonds) price.bonds = Number(bonds[1].replace(',', '.'));
  if (regls) price.regls = Number(regls[1].replace(',', '.'));
  return price;
}
