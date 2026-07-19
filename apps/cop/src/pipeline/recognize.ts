import { invoke } from '@tauri-apps/api/core';
import type { CapturedWindow, Recognized } from '../types';
import { computePHash, matchNearest, unresolved } from './phash';
import { recognizeCount } from './ocr';

export interface InventoryCorner {
  x: number;
  y: number;
  template_width: number;
  template_height: number;
  score: number;
}

export interface GridConfig {
  /** Сдвиг от найденного угла до первой ячейки (обычно рамка + padding). */
  offset_x: number;
  offset_y: number;
  /** Размер квадратной ячейки в px. */
  cell_size: number;
  /** Количество столбцов и строк в сетке. */
  cols: number;
  rows: number;
}

// Дефолт под 1920×1080 (типичное разрешение игры сейчас). Инвентарь
// в игре — 3 колонки × 4 строки (плюс пагинация «1/N» на нижней
// границе). Cell size ~48 px — грубая оценка по скрину; точнее
// подкручивается через форму «Настройки сетки» с визуальным оверлеем.
export const DEFAULT_GRID: GridConfig = {
  offset_x: 8,
  offset_y: 8,
  cell_size: 48,
  cols: 3,
  rows: 4,
};

async function decodeCapturedToCanvas(captured: CapturedWindow): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('2D context недоступен'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };
    img.onerror = () => reject(new Error('Не удалось декодировать PNG скрина'));
    img.src = `data:image/png;base64,${captured.png_base64}`;
  });
}

function cropToCanvas(
  source: HTMLCanvasElement,
  x: number,
  y: number,
  w: number,
  h: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context недоступен');
  ctx.drawImage(source, x, y, w, h, 0, 0, w, h);
  return canvas;
}

/**
 * Каталоги, которые могут встречаться в инвентаре игры. Ограничение
 * pool'а pHash-матчинга ускоряет поиск и снижает false-positive'ы —
 * например, чертёж «Пулемёт» не должен матчиться с оружием «Пулемёт».
 */
const INVENTORY_CATALOGS = [
  'ammo',
  'components',
  'equipment',
  'items',
  'loot',
  'ore',
  'weapons',
  'blueprints',
];

export async function findInventoryCorner(
  captured: CapturedWindow
): Promise<InventoryCorner | null> {
  return invoke<InventoryCorner | null>('find_inventory_corner', {
    pngBase64: captured.png_base64,
  });
}

export interface PageResult {
  items: Recognized[];
  /** Найденный угол UI-рамки инвентаря — null, если matching провалился.
   *  Нужен UI-слою для визуализации оверлея на скрине. */
  corner: InventoryCorner | null;
}

export async function recognizePage(
  captured: CapturedWindow,
  grid: GridConfig = DEFAULT_GRID
): Promise<PageResult> {
  const corner = await findInventoryCorner(captured);
  if (!corner) {
    console.warn(
      'recognizePage: UI-рамка инвентаря не найдена (template matching score > 0.5). ' +
        'Скорее всего окно не то или инвентарь не открыт.'
    );
    return { items: [], corner: null };
  }

  const source = await decodeCapturedToCanvas(captured);
  const startX = corner.x + grid.offset_x;
  const startY = corner.y + grid.offset_y;

  const results: Recognized[] = [];

  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const cellX = startX + col * grid.cell_size;
      const cellY = startY + row * grid.cell_size;

      // Bounds check: если сетка вылезла за пределы скрина — стоп.
      if (cellX + grid.cell_size > source.width || cellY + grid.cell_size > source.height) {
        continue;
      }

      // Верхние ~75% ячейки — иконка предмета, нижние ~25% — цифра
      // количества. Разделение эмпирическое, подобранное под UI игры;
      // если UI поменяется — правим здесь.
      const iconH = Math.round(grid.cell_size * 0.75);
      const countH = grid.cell_size - iconH;

      const iconCanvas = cropToCanvas(source, cellX, cellY, grid.cell_size, iconH);
      const countCanvas = cropToCanvas(source, cellX, cellY + iconH, grid.cell_size, countH);

      const hash = computePHash(iconCanvas);
      const match = matchNearest(hash, { preferCatalogs: INVENTORY_CATALOGS });
      const count = await recognizeCount(countCanvas);

      // Ячейка без числа = скорее всего пустой слот инвентаря; скипаем.
      if (count === null || count === 0) continue;

      const cellDataUrl = iconCanvas.toDataURL('image/png');

      if (!match || match.confidence < 0.6) {
        results.push({
          ...unresolved(cellDataUrl),
          count,
        });
        continue;
      }

      results.push({
        item_key: match.item_key,
        catalog: match.catalog,
        count,
        confidence: match.confidence,
        cell_data_url: cellDataUrl,
      });
    }
  }

  return { items: results, corner };
}
