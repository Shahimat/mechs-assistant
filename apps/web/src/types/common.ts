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

/**
 * Один ингредиент трансформации weapon/equipment — ссылка на другой
 * каталог (обычно ore/loot/components) с количеством.
 */
export interface TransformIngredient {
  /** key целевой сущности из другого каталога (translit). */
  key: string;
  /**
   * Каталог, куда указывает key. Опционально: заполняется build-data
   * merger'ом через cross-catalog lookup (unresolved → null + warning
   * в build-log).
   */
  catalog?: string;
  count: number;
}

/**
 * Трансформация — как получить weapon/equipment из предыдущего варианта
 * (напр. «Мортира ← Мортира 5»). Данные из td «Преобразуется из» +
 * «Для преобразования требуется» на странице weapon/equipment.
 */
export interface Transform {
  /** key предыдущего weapon/equipment из того же каталога. */
  fromKey: string;
  ingredients: TransformIngredient[];
  bondsCost?: number;
  reglsCost?: number;
}
