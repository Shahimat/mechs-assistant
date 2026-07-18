/**
 * Общие типы приложения. Дублируют структуры, которые Rust-часть
 * сериализует через serde — поля должны совпадать по имени.
 */

export interface WindowInfo {
  id: number;
  title: string;
  width: number;
  height: number;
  is_minimized: boolean;
}

export interface CapturedWindow {
  title: string;
  width: number;
  height: number;
  /** PNG-бинарь, encoded base64 (без префикса data:). */
  png_base64: string;
}

/**
 * Одна распознанная позиция инвентаря. `item_key` — key из
 * data-каталогов основного проекта (`data/icons/<catalog>/<key>.webp`);
 * `catalog` — slug каталога (weapons/loot/ore/…). `unresolved` = не
 * нашли соответствия в pHash-индексе (fallback: показать сырую ячейку).
 */
export interface Recognized {
  item_key: string;
  catalog: string | null;
  count: number;
  /** Уверенность match'а (0..1). Ниже 0.7 обычно требует ручной правки. */
  confidence: number;
  /** Ссылка на исходную ячейку (data URL cropped image) для preview/дебага. */
  cell_data_url?: string;
  unresolved?: boolean;
}

export interface SeriesState {
  active: boolean;
  pages: Recognized[][];
}
