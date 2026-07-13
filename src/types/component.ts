import type { Price, OverlayMeta } from './common';

export type ComponentKind = 'base' | 'composite';

/**
 * Один вход в рецепте крафта компонента: другой компонент или лут-предмет.
 * Заполняется через overlay (Sheets) — формат «Плата|2; Кислота|1» в ячейке.
 * Формат Sheets → `RecipeItem[]` — задача overlay merger'а (пока не реализовано,
 * overlay recipe на старте MVP1 пуст).
 */
export interface RecipeItem {
  name: string;
  count: number;
}

export interface ComponentStats {
  weight: number;
}

export interface Component {
  key: string;
  name: string;
  model: string;
  stats: ComponentStats;
  /**
   * Классификация — приходит из overlay (Sheets), не из вики.
   * На старте MVP1 отсутствует, потому что overlay пуст.
   */
  kind?: ComponentKind;
  /**
   * Список названий чертежей, из которых крафтится компонент. Парсер
   * собирает по `<a data-description>` внутри td, аналогично
   * `ore.foundIn`.
   */
  craftFromBlueprints?: string[];
  /**
   * Рецепт: из чего состоит компонент. Заполняется через overlay
   * (Sheets), в вики этих данных нет. На старте MVP1 пусто.
   */
  recipe?: RecipeItem[];
  sellPrice?: Price;
  description?: string;
  iconPath?: string;
  wikiUrl?: string;
  _meta?: OverlayMeta;
}
