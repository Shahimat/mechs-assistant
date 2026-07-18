import type { Price, OverlayMeta } from './common';

export type BlueprintCategory =
  'mech' | 'weapon' | 'equipment' | 'component' | 'pack' | 'upgrade' | 'teleport';

/**
 * Один ингредиент рецепта чертежа — ссылка на другой каталог с
 * количеством. Структурно совпадает с `TransformIngredient` из common,
 * но семантически отдельный тип (рецепт крафта с нуля, а не
 * трансформация).
 */
export interface BlueprintIngredient {
  key: string;
  /** Резолвится build-data merger'ом через lookup по всем parsed JSON'ам. */
  catalog?: string;
  count: number;
}

export interface BlueprintStats {
  /** «Износостойкость» — сколько раз можно использовать чертёж. */
  durability: number;
}

export interface Blueprint {
  key: string;
  name: string;
  model: string;
  category: BlueprintCategory;
  /** Только для equipment: 'cargo' | 'computer' | 'armour' | 'shield'. */
  subtype?: string;

  // === рецепт (обязательный: чертёж без рецепта бессмыслен) ===
  /** key целевой сущности из producesCatalog (translit от name без «Чертеж »). */
  producesKey: string;
  /** 'weapons' | 'equipment' | 'components' | 'items'. */
  producesCatalog?: string;
  /** «Создает» — сколько получается за 1 крафт. */
  output: number;
  ingredients: BlueprintIngredient[];
  /** «Навык специалист: N» — требуемый уровень навыка. */
  skillSpecialist?: number;
  /** «Боны: N». */
  bondsCost?: number;
  /** «Реглы: N» (если встретится). */
  reglsCost?: number;

  // === свойства самого чертежа ===
  stats: BlueprintStats;
  sellPrice?: Price;
  description?: string;
  iconPath?: string;
  wikiUrl?: string;
  _meta?: OverlayMeta;
}
