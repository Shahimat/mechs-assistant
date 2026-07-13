import { promises as fs } from 'node:fs';
import path from 'node:path';
import { downloadFile } from './fetch.js';
import { convertToWebp } from '../../convert-to-webp/index.js';

/**
 * Entity, у которой есть iconPath (после парсинга URL иконки на вики)
 * и key (уникальный идентификатор — используется как имя файла).
 */
export interface IconEntry {
  key: string;
  iconPath?: string;
}

/**
 * Скачивает иконки, конвертит в WebP (Lanczos3 upscale до 128), обновляет
 * `entry.iconPath` на локальный URL `<iconsUrlPrefix>/<key>.webp`.
 *
 * Ошибки скачивания отдельных иконок логируются и не прерывают процесс —
 * такому entry просто удаляется iconPath.
 */
export async function downloadAndConvertIcons(
  entries: IconEntry[],
  iconsDir: string,
  iconsUrlPrefix: string
): Promise<void> {
  await fs.mkdir(iconsDir, { recursive: true });
  const downloaded: string[] = [];

  for (const entry of entries) {
    if (!entry.iconPath) continue;
    const iconUrl = entry.iconPath;
    const iconFile = path.join(iconsDir, `${entry.key}.png`);
    try {
      await downloadFile(iconUrl, iconFile);
      entry.iconPath = `${iconsUrlPrefix}/${entry.key}.png`;
      downloaded.push(iconFile);
    } catch (err) {
      console.warn(`  icon fail for ${entry.key}: ${(err as Error).message}`);
      delete entry.iconPath;
    }
  }

  if (downloaded.length === 0) return;

  console.log(`  converting ${downloaded.length} icons to WebP...`);
  const results = await convertToWebp(downloaded, {
    // resizeTo: 128 — умеренный Lanczos3-upscale маленьких иконок
    // (обычно 64×64) до 128×128. Больше не даёт видимого прироста
    // качества, но раздувает файлы.
    resizeTo: 128,
    // lossy quality: 90 — визуально неотличимо от lossless для иконок,
    // но 2-3× меньше размер.
    lossless: false,
    quality: 90,
  });

  const converted = new Set<string>();
  let totalIn = 0;
  let totalOut = 0;
  for (const r of results) {
    if (r.error) {
      console.warn(`  convert fail: ${r.input}: ${r.error}`);
    } else {
      converted.add(path.basename(r.input, '.png'));
      totalIn += r.originalSize;
      totalOut += r.newSize;
    }
  }
  for (const entry of entries) {
    if (entry.iconPath?.endsWith('.png') && converted.has(entry.key)) {
      entry.iconPath = entry.iconPath.replace(/\.png$/, '.webp');
    }
  }
  const savedPct = totalIn > 0 ? Math.round(((totalIn - totalOut) / totalIn) * 100) : 0;
  console.log(`  ${converted.size} converted, ${totalIn}→${totalOut} B (-${savedPct}%)`);
}
