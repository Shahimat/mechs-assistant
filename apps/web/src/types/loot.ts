import type { Price, OverlayMeta } from './common';

/**
 * Источник выпадения — монстры / кроты / пираты. Массив, чтобы поддержать
 * будущие пересечения (напр., «универсальный сертификат» с монстров и
 * пиратов). На 2026-07-14 сумма страниц не даёт пересечений, `sources`
 * всегда одноэлементный.
 */
export type LootSource = 'monster' | 'mole' | 'pirate';

export interface LootStats {
  weight: number;
}

export interface Loot {
  key: string;
  name: string;
  model: string;
  sources: LootSource[];
  stats: LootStats;
  /**
   * «Находится в» с вики — список источников выпадения (когда поле
   * есть). По образцу `ore.foundIn`.
   */
  foundIn?: string[];
  sellPrice?: Price;
  description?: string;
  iconPath?: string;
  wikiUrl?: string;
  _meta?: OverlayMeta;
}
