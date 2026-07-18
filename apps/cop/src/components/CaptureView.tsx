import { useEffect, useRef } from 'react';
import type { CapturedWindow } from '../types';
import type { GridConfig, InventoryCorner } from '../pipeline/recognize';
import { drawAnnotatedCapture, loadImageFromBase64 } from '../utils/annotateCanvas';

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
    let cancelled = false;
    loadImageFromBase64(captured.png_base64)
      .then((img) => {
        if (cancelled) return;
        drawAnnotatedCapture(canvas, img, corner, grid);
      })
      .catch((err) => {
        console.warn('CaptureView: не удалось декодировать PNG скрина', err);
      });
    return () => {
      cancelled = true;
    };
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
