import phashIndex from '@/generated/phash-index.json';
import type { Recognized } from '@/types';

interface IndexEntry {
  catalog: string;
  item_key: string;
  hash: string;
}

interface IndexFile {
  _generated_at: string;
  _hash_side: number;
  _bits: number;
  entries: IndexEntry[];
}

const INDEX = phashIndex as IndexFile;

/**
 * Считает perceptual hash по тем же правилам, что и билд-скрипт
 * `scripts/build-phash-index.mjs`. Работает на `ImageData` (canvas API)
 * — резайз через canvas 2D API, grayscale и average.
 */
export function computePHash(source: ImageData | HTMLCanvasElement): string {
  const side = INDEX._hash_side;
  const bits = INDEX._bits;

  const canvas = document.createElement('canvas');
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('2D canvas context недоступен');

  if (source instanceof HTMLCanvasElement) {
    ctx.drawImage(source, 0, 0, side, side);
  } else {
    // Через промежуточный canvas — рисуем ImageData как есть, потом
    // scale drawImage на целевой размер.
    const tmp = document.createElement('canvas');
    tmp.width = source.width;
    tmp.height = source.height;
    const tmpCtx = tmp.getContext('2d');
    if (!tmpCtx) throw new Error('2D canvas context недоступен');
    tmpCtx.putImageData(source, 0, 0);
    ctx.drawImage(tmp, 0, 0, side, side);
  }

  const { data } = ctx.getImageData(0, 0, side, side);
  const gray = new Uint8Array(bits);
  let sum = 0;
  for (let i = 0; i < bits; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    // Luminance по BT.601.
    const y = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    gray[i] = y;
    sum += y;
  }
  const mean = sum / bits;

  const hex: string[] = [];
  for (let byte = 0; byte < bits / 8; byte++) {
    let b = 0;
    for (let bit = 0; bit < 8; bit++) {
      if (gray[byte * 8 + bit] >= mean) b |= 1 << (7 - bit);
    }
    hex.push(b.toString(16).padStart(2, '0'));
  }
  return hex.join('');
}

/** Побитовая Hamming distance для двух hex-строк одинаковой длины. */
export function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) return Number.MAX_SAFE_INTEGER;
  let dist = 0;
  for (let i = 0; i < a.length; i += 2) {
    const av = parseInt(a.slice(i, i + 2), 16);
    const bv = parseInt(b.slice(i, i + 2), 16);
    let x = av ^ bv;
    while (x) {
      dist += x & 1;
      x >>>= 1;
    }
  }
  return dist;
}

/**
 * Матчит `hash` против index'а: возвращает ближайшую иконку и
 * confidence (0..1, чем выше — тем увереннее). Confidence = 1 -
 * distance / max_bits, но нижняя граница ~0.6 обычно означает
 * «непохоже, надо ручной осмотр».
 *
 * `preferCatalogs` — фильтр по каталогам (например, лут+ore+components
 * для содержимого инвентаря; не искать среди чертежей).
 */
export function matchNearest(
  hash: string,
  opts: { preferCatalogs?: string[] } = {}
): { item_key: string; catalog: string; confidence: number } | null {
  const pool = opts.preferCatalogs?.length
    ? INDEX.entries.filter((e) => opts.preferCatalogs!.includes(e.catalog))
    : INDEX.entries;

  let best: IndexEntry | null = null;
  let bestDist = Number.MAX_SAFE_INTEGER;
  for (const e of pool) {
    const d = hammingDistance(hash, e.hash);
    if (d < bestDist) {
      bestDist = d;
      best = e;
    }
  }
  if (!best) return null;
  const confidence = 1 - bestDist / INDEX._bits;
  return { item_key: best.item_key, catalog: best.catalog, confidence };
}

/** Итог: сколько всего иконок в pHash-индексе (для UI-диагностики). */
export const INDEX_SIZE = INDEX.entries.length;

/** Экспорт «пустой» распознанной записи для fallback-случаев. */
export function unresolved(cellDataUrl?: string): Recognized {
  return {
    item_key: '?',
    catalog: null,
    count: 0,
    confidence: 0,
    cell_data_url: cellDataUrl,
    unresolved: true,
  };
}
