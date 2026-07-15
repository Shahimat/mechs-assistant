import { useEffect, useRef } from 'react';
import type { CapturedWindow } from '../types';
import type { GridConfig, InventoryCorner } from '../pipeline/recognize';

interface CaptureViewProps {
  captured: CapturedWindow;
  /** Найденный угол UI-рамки инвентаря (null = matching провалился). */
  corner: InventoryCorner | null;
  /** Текущие параметры сетки — для оверлея ячеек. */
  grid: GridConfig;
}

/**
 * Показывает PNG-скрин окна с оверлеем: красная рамка вокруг найденного
 * угла инвентаря + жёлтая сетка ячеек по текущим GridConfig. Оверлей
 * рисуется на canvas — можно быстро подкручивать сетку в форме и сразу
 * видеть, где будет crop.
 */
export function CaptureView({ captured, corner, grid }: CaptureViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      if (!corner) return;

      // Красный контур вокруг найденного шаблона угла.
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.95)';
      ctx.lineWidth = 2;
      ctx.strokeRect(corner.x, corner.y, corner.template_width, corner.template_height);

      // Жёлтая сетка ячеек — то, что реально будет резаться на pHash+OCR.
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
    };
    img.src = `data:image/png;base64,${captured.png_base64}`;
  }, [captured, corner, grid]);

  const confidence = corner ? 1 - corner.score : 0;

  return (
    <div className="capture-view">
      <p className="muted">
        <strong>{captured.title}</strong> · {captured.width}×{captured.height} px
        {corner ? (
          <>
            {' · '}рамка найдена: x={corner.x}, y={corner.y}, conf={(confidence * 100).toFixed(0)}%
          </>
        ) : (
          <>
            {' · '}
            <span style={{ color: '#b00020' }}>
              рамка инвентаря не найдена — открой инвентарь в игре и переснимай
            </span>
          </>
        )}
      </p>
      <canvas ref={canvasRef} className="capture-image" />
    </div>
  );
}
