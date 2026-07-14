import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { downloadFile } from './fetch.js';
import { convertToWebp } from '../../convert-to-webp/index.js';

/** Финальный размер иконки после конверсии (px, обе стороны). */
const ICON_SIZE = 128;
/**
 * Размер продукт-иконки, наложенной на background (px, обе стороны).
 * Оставляет ~20% рамки под «планшет» — визуально совпадает с игровым
 * рендером чертежа (см. `assets/raw/blueprint.png`).
 */
const OVERLAY_PRODUCT_SIZE = 82;

/**
 * Entity, у которой есть iconPath (после парсинга URL иконки на вики)
 * и key (уникальный идентификатор — используется как имя файла).
 */
export interface IconEntry {
  key: string;
  iconPath?: string;
}

export interface DownloadIconsOptions {
  /**
   * Путь к PNG-фону, который накладывается под каждую иконку. Если задан,
   * итоговая картинка = background (128×128) + product-icon (~82×82,
   * gravity=center). Используется для чертежей — иконка целевого предмета
   * рендерится поверх «планшета» (см. assets/raw/blueprint.png).
   */
  overlayBackground?: string;
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
  iconsUrlPrefix: string,
  options: DownloadIconsOptions = {}
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

  const converted = new Set<string>();
  let totalIn = 0;
  let totalOut = 0;

  if (options.overlayBackground) {
    console.log(
      `  composing ${downloaded.length} icons with background (${path.basename(
        options.overlayBackground
      )})...`
    );
    const composed = await composeWithBackground(downloaded, options.overlayBackground);
    for (const r of composed) {
      if (r.error) {
        console.warn(`  compose fail: ${r.input}: ${r.error}`);
      } else {
        converted.add(path.basename(r.input, '.png'));
        totalIn += r.originalSize;
        totalOut += r.newSize;
      }
    }
  } else {
    console.log(`  converting ${downloaded.length} icons to WebP...`);
    const results = await convertToWebp(downloaded, {
      // resizeTo: 128 — умеренный Lanczos3-upscale маленьких иконок
      // (обычно 64×64) до 128×128. Больше не даёт видимого прироста
      // качества, но раздувает файлы.
      resizeTo: ICON_SIZE,
      // lossy quality: 90 — визуально неотличимо от lossless для иконок,
      // но 2-3× меньше размер.
      lossless: false,
      quality: 90,
    });
    for (const r of results) {
      if (r.error) {
        console.warn(`  convert fail: ${r.input}: ${r.error}`);
      } else {
        converted.add(path.basename(r.input, '.png'));
        totalIn += r.originalSize;
        totalOut += r.newSize;
      }
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

interface ComposeResult {
  input: string;
  originalSize: number;
  newSize: number;
  error?: string;
}

/**
 * Композитит каждый входной PNG с общим фоном и пишет результат в WebP
 * рядом (с расширением `.webp`). Исходный PNG удаляется по успеху.
 * Продукт-иконка ресайзится до OVERLAY_PRODUCT_SIZE, кладётся по центру
 * фона размера ICON_SIZE×ICON_SIZE. Фон подготавливается один раз для
 * всего батча.
 */
async function composeWithBackground(
  inputPaths: string[],
  backgroundPath: string
): Promise<ComposeResult[]> {
  const bgBuffer = await sharp(backgroundPath)
    .resize({
      width: ICON_SIZE,
      height: ICON_SIZE,
      fit: 'cover',
      kernel: 'lanczos3',
    })
    .png()
    .toBuffer();

  const results: ComposeResult[] = [];
  for (const inputPath of inputPaths) {
    const output = inputPath.replace(/\.png$/, '.webp');
    const r: ComposeResult = { input: inputPath, originalSize: 0, newSize: 0 };
    try {
      const inStat = await fs.stat(inputPath);
      r.originalSize = inStat.size;

      const product = await sharp(inputPath)
        .resize({
          width: OVERLAY_PRODUCT_SIZE,
          height: OVERLAY_PRODUCT_SIZE,
          fit: 'inside',
          kernel: 'lanczos3',
          withoutEnlargement: false,
        })
        .png()
        .toBuffer();

      await sharp(bgBuffer)
        .composite([{ input: product, gravity: 'center' }])
        .webp({ quality: 90 })
        .toFile(output);

      const outStat = await fs.stat(output);
      r.newSize = outStat.size;

      if (path.resolve(inputPath) !== path.resolve(output)) {
        await fs.unlink(inputPath);
      }
    } catch (err) {
      r.error = err instanceof Error ? err.message : String(err);
    }
    results.push(r);
  }
  return results;
}
