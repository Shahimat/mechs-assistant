import type { CapturedWindow } from '../types';

interface CaptureViewProps {
  captured: CapturedWindow;
}

/**
 * Показывает PNG-скрин окна из Rust-команды `capture_window`. Ограничен
 * по ширине, чтобы большие скрины (2560+) не растягивали окно приложения.
 */
export function CaptureView({ captured }: CaptureViewProps) {
  const src = `data:image/png;base64,${captured.png_base64}`;
  return (
    <div className="capture-view">
      <p className="muted">
        <strong>{captured.title}</strong> · {captured.width}×{captured.height} px
      </p>
      <img src={src} alt={captured.title} className="capture-image" />
    </div>
  );
}
