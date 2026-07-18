import type { Price, OverlayMeta } from './common';

export interface OreStats {
  weight: number;
}

export interface Ore {
  key: string;
  name: string;
  model: string;
  stats: OreStats;
  /**
   * Список источников выпадения — имена предметов/монстров/паков, из
   * которых выпадает эта руда. У Магмы и Цезия отсутствует (добываются
   * на шахтах/заводах). Данные о количестве и шансе на вики
   * отсутствуют — отсюда `string[]`, а не `LootDrop[]` как у items.
   */
  foundIn?: string[];
  sellPrice?: Price;
  craftFromBlueprints?: string[];
  description?: string;
  iconPath?: string;
  wikiUrl?: string;
  _meta?: OverlayMeta;
}
