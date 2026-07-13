/** Валютная пара игры Мехи.Земля — используется в ценах у всех каталогов. */
export interface Price {
  bonds?: number;
  regls?: number;
}

/**
 * Meta-поля, которые build-time merger (`scripts/build-data`) добавляет
 * к записи каталога, если у неё есть overlay из Google Sheets.
 * Используется UI (`OverlayBadge`, `OverlayPill`) для подсветки уточнённых
 * полей.
 */
export interface OverlayMeta {
  overlayFields: string[];
  overlayUpdatedAt?: string;
  overlaySource?: string;
}
