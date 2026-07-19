import type { GridConfig, InventoryCorner } from '@/pipeline/recognize';

/**
 * Общая логика отрисовки скрина окна + оверлея (красная рамка вокруг
 * найденного угла инвентаря + жёлтая сетка ячеек с порядковыми
 * номерами). Используется в двух местах:
 *   - `CaptureView` для отображения на экране;
 *   - `diagnostic.ts` для генерации screenshot-annotated.png в ZIP.
 */
export function drawAnnotatedCapture(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  corner: InventoryCorner | null,
  grid: GridConfig
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  ctx.drawImage(image, 0, 0);

  if (!corner) return;

  ctx.strokeStyle = 'rgba(255, 0, 0, 0.95)';
  ctx.lineWidth = 2;
  ctx.strokeRect(corner.x, corner.y, corner.template_width, corner.template_height);

  ctx.strokeStyle = 'rgba(255, 200, 0, 0.85)';
  ctx.lineWidth = 1;
  ctx.font = '11px monospace';
  ctx.fillStyle = 'rgba(255, 200, 0, 0.95)';
  const startX = corner.x + grid.offset_x;
  const startY = corner.y + grid.offset_y;
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const x = startX + col * grid.cell_size;
      const y = startY + row * grid.cell_size;
      ctx.strokeRect(x, y, grid.cell_size, grid.cell_size);
      ctx.fillText(String(row * grid.cols + col + 1), x + 3, y + 12);
    }
  }
}

export function loadImageFromBase64(pngBase64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image decode failed'));
    img.src = `data:image/png;base64,${pngBase64}`;
  });
}
