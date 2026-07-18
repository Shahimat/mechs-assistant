import { zipSync, strToU8 } from 'fflate';
import type { CapturedWindow, Recognized } from '../types';
import type { GridConfig, InventoryCorner } from './recognize';
import { drawAnnotatedCapture, loadImageFromBase64 } from '../utils/annotateCanvas';

/**
 * Phase K: сборка диагностического ZIP с полным контекстом сессии для
 * отправки агенту одним файлом (без скроллинга и множественных скринов).
 *
 * Содержимое ZIP:
 *   - meta.json         — параметры сессии (title, dims, corner, grid, recognized[])
 *   - screenshot-raw.png — оригинальный PNG окна из Rust capture_window
 *   - screenshot-annotated.png — тот же скрин + красный контур угла +
 *                                жёлтая сетка ячеек с номерами
 *   - cells/<row>-<col>-icon.png  — верхние 75% каждой ячейки (что видит pHash)
 *   - cells/<row>-<col>-count.png — нижние 25% ячейки (что видит OCR)
 *   - console.log       — warn/error за сессию (перехвачены в App.tsx)
 */

export interface DiagnosticState {
  captured: CapturedWindow | null;
  corner: InventoryCorner | null;
  grid: GridConfig;
  recognized: Recognized[];
  seriesPageCount: number;
  /** Собирается через глобальный перехват console.warn/error в App.tsx. */
  logLines: string[];
}

async function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) return reject(new Error('canvas.toBlob вернул null'));
      resolve(new Uint8Array(await blob.arrayBuffer()));
    }, 'image/png');
  });
}

function base64ToBytes(base64: string): Uint8Array {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function cropToCanvas(
  source: HTMLCanvasElement,
  x: number,
  y: number,
  w: number,
  h: number
): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2D context недоступен');
  ctx.drawImage(source, x, y, w, h, 0, 0, w, h);
  return c;
}

export async function buildDiagnosticZip(state: DiagnosticState): Promise<Uint8Array> {
  const files: Record<string, Uint8Array> = {};
  const timestamp = new Date().toISOString();

  const meta = {
    timestamp,
    captured: state.captured
      ? {
          title: state.captured.title,
          width: state.captured.width,
          height: state.captured.height,
        }
      : null,
    corner: state.corner,
    grid: state.grid,
    recognized: state.recognized.map((r) => ({
      item_key: r.item_key,
      catalog: r.catalog,
      count: r.count,
      confidence: r.confidence,
      unresolved: r.unresolved ?? false,
    })),
    seriesPageCount: state.seriesPageCount,
    userAgent: navigator.userAgent,
  };
  files['meta.json'] = strToU8(JSON.stringify(meta, null, 2));
  files['console.log'] = strToU8((state.logLines.join('\n') || '(лог пуст)') + '\n');

  if (state.captured) {
    files['screenshot-raw.png'] = base64ToBytes(state.captured.png_base64);

    const img = await loadImageFromBase64(state.captured.png_base64);

    const annotated = document.createElement('canvas');
    drawAnnotatedCapture(annotated, img, state.corner, state.grid);
    files['screenshot-annotated.png'] = await canvasToPngBytes(annotated);

    // Cell crops — только если рамка нашлась (без неё координаты не
    // имеют смысла). Кроп по тем же правилам, что в `recognizePage`:
    // верхние 75% высоты ячейки = иконка (pHash), нижние 25% = цифра (OCR).
    if (state.corner) {
      const source = document.createElement('canvas');
      source.width = img.naturalWidth;
      source.height = img.naturalHeight;
      source.getContext('2d')!.drawImage(img, 0, 0);

      const iconH = Math.round(state.grid.cell_size * 0.75);
      const countH = state.grid.cell_size - iconH;
      const startX = state.corner.x + state.grid.offset_x;
      const startY = state.corner.y + state.grid.offset_y;

      for (let row = 0; row < state.grid.rows; row++) {
        for (let col = 0; col < state.grid.cols; col++) {
          const cellX = startX + col * state.grid.cell_size;
          const cellY = startY + row * state.grid.cell_size;
          if (
            cellX + state.grid.cell_size > source.width ||
            cellY + state.grid.cell_size > source.height
          ) {
            continue;
          }
          const iconCanvas = cropToCanvas(source, cellX, cellY, state.grid.cell_size, iconH);
          const countCanvas = cropToCanvas(
            source,
            cellX,
            cellY + iconH,
            state.grid.cell_size,
            countH
          );
          files[`cells/${row}-${col}-icon.png`] = await canvasToPngBytes(iconCanvas);
          files[`cells/${row}-${col}-count.png`] = await canvasToPngBytes(countCanvas);
        }
      }
    }
  }

  return zipSync(files);
}

/**
 * Тригерит скачивание ZIP в default-папку загрузок браузерным Anchor'ом.
 * В Tauri webview это работает — файл падает в `~/Downloads` на маке,
 * `%USERPROFILE%\Downloads` на Windows.
 */
export function downloadZip(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes as BlobPart], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
