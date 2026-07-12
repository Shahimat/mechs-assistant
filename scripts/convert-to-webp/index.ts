import sharp from 'sharp';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface ConvertOptions {
  /** Lossless-режим — сохраняет пиксельную точность (для маленьких иконок предпочтителен). */
  lossless?: boolean;
  /** Качество 1..100 (действует только при lossless: false). */
  quality?: number;
  /** Удалить исходник после успешной конверсии. */
  removeOriginal?: boolean;
  /** Пропустить конверсию, если .webp уже существует. */
  skipIfExists?: boolean;
  /**
   * Целевой размер большей стороны (upscale/downscale через Lanczos3).
   * Полезно для маленьких иконок, которые в UI будут растягиваться —
   * заранее увеличиваем через качественный ресемплинг, а не через
   * браузерную интерполяцию.
   */
  resizeTo?: number;
}

export interface ConvertResult {
  input: string;
  output: string;
  originalSize: number;
  newSize: number;
  savedBytes: number;
  savedPercent: number;
  skipped?: boolean;
  error?: string;
}

const DEFAULTS: Required<ConvertOptions> = {
  lossless: true,
  quality: 90,
  removeOriginal: true,
  skipIfExists: false,
  resizeTo: 0,
};

/**
 * Конвертирует список файлов изображений в WebP.
 * Не бросает при ошибках отдельных файлов — фиксирует их в поле `error` результата.
 */
export async function convertToWebp(
  inputPaths: string[],
  options: ConvertOptions = {}
): Promise<ConvertResult[]> {
  const opts = { ...DEFAULTS, ...options };
  const results: ConvertResult[] = [];

  for (const inputPath of inputPaths) {
    const output = replaceExt(inputPath, '.webp');
    const result: ConvertResult = {
      input: inputPath,
      output,
      originalSize: 0,
      newSize: 0,
      savedBytes: 0,
      savedPercent: 0,
    };

    try {
      const inStat = await fs.stat(inputPath);
      result.originalSize = inStat.size;

      if (opts.skipIfExists && (await exists(output))) {
        const outStat = await fs.stat(output);
        result.newSize = outStat.size;
        result.savedBytes = result.originalSize - result.newSize;
        result.savedPercent = percent(result.savedBytes, result.originalSize);
        result.skipped = true;
        results.push(result);
        continue;
      }

      let pipeline = sharp(inputPath);
      if (opts.resizeTo > 0) {
        pipeline = pipeline.resize({
          width: opts.resizeTo,
          height: opts.resizeTo,
          fit: 'inside',
          kernel: 'lanczos3',
          withoutEnlargement: false,
        });
      }
      pipeline = pipeline.webp(
        opts.lossless ? { lossless: true } : { quality: opts.quality }
      );
      await pipeline.toFile(output);

      const outStat = await fs.stat(output);
      result.newSize = outStat.size;
      result.savedBytes = result.originalSize - result.newSize;
      result.savedPercent = percent(result.savedBytes, result.originalSize);

      if (opts.removeOriginal && path.resolve(inputPath) !== path.resolve(output)) {
        await fs.unlink(inputPath);
      }
    } catch (err) {
      result.error = err instanceof Error ? err.message : String(err);
    }

    results.push(result);
  }

  return results;
}

function replaceExt(p: string, newExt: string): string {
  const dir = path.dirname(p);
  const name = path.basename(p, path.extname(p));
  return path.join(dir, name + newExt);
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function percent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

// -------- CLI --------

async function cli(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error(
      'usage: npm run convert:webp -- <path> [<path>...]\n' +
        '  --keep-original       не удалять исходник\n' +
        '  --quality=N           lossy режим с указанным качеством (1..100)\n' +
        '  --resize=N            привести большую сторону к N пикселей (Lanczos3, fit inside)\n' +
        '  --skip-if-exists      пропускать, если .webp уже есть'
    );
    process.exit(1);
  }

  const options: ConvertOptions = {};
  const paths: string[] = [];
  for (const a of args) {
    if (a === '--keep-original') options.removeOriginal = false;
    else if (a === '--skip-if-exists') options.skipIfExists = true;
    else if (a.startsWith('--quality=')) {
      options.lossless = false;
      options.quality = Number(a.slice('--quality='.length));
    } else if (a.startsWith('--resize=')) {
      options.resizeTo = Number(a.slice('--resize='.length));
    } else if (a.startsWith('--')) {
      console.error(`неизвестный флаг: ${a}`);
      process.exit(1);
    } else {
      paths.push(a);
    }
  }

  const results = await convertToWebp(paths, options);
  let ok = 0;
  let failed = 0;
  let totalIn = 0;
  let totalOut = 0;

  for (const r of results) {
    if (r.error) {
      failed++;
      console.error(`  ✗ ${r.input}: ${r.error}`);
    } else if (r.skipped) {
      console.log(`  ⋯ ${path.basename(r.input)} (уже есть)`);
    } else {
      ok++;
      totalIn += r.originalSize;
      totalOut += r.newSize;
      console.log(
        `  ✓ ${path.basename(r.input)} → ${path.basename(r.output)}  ` +
          `${r.originalSize}→${r.newSize} B  (-${r.savedPercent}%)`
      );
    }
  }
  console.log(
    `\ndone: ${ok} ok, ${failed} failed, ` +
      `total ${totalIn}→${totalOut} B (-${percent(totalIn - totalOut, totalIn)}%)`
  );
}

const isMain =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  cli().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
