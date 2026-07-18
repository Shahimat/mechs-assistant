#!/usr/bin/env node
/**
 * Build-time скрипт: перебирает `data/icons/**\/*.webp` (относительно корня
 * моно-репы), вычисляет 64-битный perceptual hash каждой иконки, пишет
 * результат в `apps/cop/src/generated/phash-index.json`.
 *
 * ⚠️ Запускается ТОЛЬКО из корня монорепы:
 *
 *     npm run build:phash
 *
 * Sharp живёт в root `package.json` (devDependency), а НЕ в
 * `apps/cop`. Это осознанно: нативный Sharp хронически
 * ломает `npm ci` на Windows-CI Tauri-сборки. Индекс детерминированный
 * (зависит только от иконок) → сгенерированный JSON коммитится в git,
 * Tauri-build его просто импортирует, Sharp там не нужен.
 *
 * После изменения `data/icons/**\/*.webp` — перегенерь и закоммить
 * новый `phash-index.json`.
 *
 * Алгоритм pHash — классический average-hash по 16×16 grayscale:
 *   1. Ресайз до 16×16 через lanczos3 (устойчиво к масштабированию
 *      снимков ячеек инвентаря).
 *   2. Grayscale.
 *   3. mean(pixels) → hash: бит = 1, если пиксель ≥ mean; иначе 0.
 *   4. 256 бит → hex-строка (64 символа).
 *
 * Hamming distance между двумя hex-hash'ами → 0 (идентичные) …
 * 256 (полярные). Порог ~40 обычно означает «та же иконка со
 * сжатием/скейлом».
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(APP_ROOT, '../..');
const ICONS_ROOT = path.join(REPO_ROOT, 'data/icons');
const OUT_PATH = path.join(APP_ROOT, 'src/generated/phash-index.json');

const HASH_SIDE = 16; // 16×16 = 256 бит, 64 hex-символа
const HASH_BITS = HASH_SIDE * HASH_SIDE;

async function listIcons() {
  const catalogs = await fs.readdir(ICONS_ROOT);
  const entries = [];
  for (const catalog of catalogs) {
    const catalogDir = path.join(ICONS_ROOT, catalog);
    const stat = await fs.stat(catalogDir);
    if (!stat.isDirectory()) continue;
    const files = await fs.readdir(catalogDir);
    for (const file of files) {
      if (!file.endsWith('.webp')) continue;
      entries.push({
        catalog,
        item_key: path.basename(file, '.webp'),
        path: path.join(catalogDir, file),
      });
    }
  }
  return entries;
}

async function computePHash(imagePath) {
  const { data } = await sharp(imagePath)
    .resize(HASH_SIDE, HASH_SIDE, { kernel: 'lanczos3', fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let sum = 0;
  for (let i = 0; i < HASH_BITS; i++) sum += data[i];
  const mean = sum / HASH_BITS;

  // Пакуем биты в hex: 256 бит → 64 hex-символа.
  const hex = [];
  for (let byte = 0; byte < HASH_BITS / 8; byte++) {
    let b = 0;
    for (let bit = 0; bit < 8; bit++) {
      if (data[byte * 8 + bit] >= mean) b |= 1 << (7 - bit);
    }
    hex.push(b.toString(16).padStart(2, '0'));
  }
  return hex.join('');
}

async function main() {
  console.log(`▶ icons root: ${ICONS_ROOT}`);
  const entries = await listIcons();
  console.log(`  найдено ${entries.length} иконок`);

  const index = [];
  let done = 0;
  for (const entry of entries) {
    try {
      const hash = await computePHash(entry.path);
      index.push({
        catalog: entry.catalog,
        item_key: entry.item_key,
        hash,
      });
    } catch (err) {
      console.warn(`  ✗ ${entry.catalog}/${entry.item_key}: ${err.message}`);
    }
    done++;
    if (done % 100 === 0) console.log(`  ...${done}/${entries.length}`);
  }

  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });
  await fs.writeFile(
    OUT_PATH,
    JSON.stringify(
      {
        _generated_at: new Date().toISOString(),
        _hash_side: HASH_SIDE,
        _bits: HASH_BITS,
        entries: index,
      },
      null,
      2
    ) + '\n'
  );
  console.log(`✓ записано ${index.length} записей → ${path.relative(APP_ROOT, OUT_PATH)}`);
}

main().catch((err) => {
  console.error('build-phash-index failed:', err);
  process.exit(1);
});
