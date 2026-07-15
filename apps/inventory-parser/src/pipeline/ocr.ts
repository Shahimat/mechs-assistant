import { createWorker, type Worker } from 'tesseract.js';

/**
 * OCR-обёртка над Tesseract. Worker создаётся лениво и переиспользуется —
 * инициализация ~10 сек (загрузка WASM + eng traineddata из CDN), после
 * этого распознавание одного числа ~50-100 мс.
 *
 * Настроен на цифры: whitelist "0123456789", PSM 7 (single line).
 * Инвентарь в игре пишет числа арабскими → русский traineddata не нужен.
 */

let workerPromise: Promise<Worker> | null = null;

async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const w = await createWorker('eng');
      await w.setParameters({
        tessedit_char_whitelist: '0123456789',
        tessedit_pageseg_mode: '7' as unknown as never,
      });
      return w;
    })();
  }
  return workerPromise;
}

/**
 * Распознаёт число на canvas (обычно — область с подписью количества
 * под иконкой). Возвращает число или null, если Tesseract не нашёл
 * цифр или дал слишком низкую уверенность.
 */
export async function recognizeCount(source: HTMLCanvasElement): Promise<number | null> {
  const worker = await getWorker();
  const dataUrl = source.toDataURL('image/png');
  const { data } = await worker.recognize(dataUrl);
  const text = (data.text ?? '').replace(/\D/g, '');
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

/** Освободить worker (например, при закрытии приложения). */
export async function terminateOcr(): Promise<void> {
  if (workerPromise) {
    const w = await workerPromise;
    await w.terminate();
    workerPromise = null;
  }
}
