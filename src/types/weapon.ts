import type { Price, OverlayMeta } from './common';

export interface WeaponStats {
  damageMin: number;
  damageMax: number;
  range: number;
  energyConsumption: number;
  rateOfFire: number; // выстрелов в минуту
  durability: number;
  weight: number;
  ammo?: number; // боезапас (снаряды); пусто = бесконечно
  minRange?: number; // мертвая зона (у пушек/гаубиц)
}

export interface Weapon {
  key: string;
  name: string;
  model: string;
  /**
   * Категория из CSS-класса вики: missile / cannon / machinegun / railgun / …
   * Определяется автоматически парсером по классу таблицы
   * `wiki-item-weapon-<category>`.
   */
  category: string;
  /** Группа орудий из поля таблицы («Пулемет», «Пушка», «Ракета», …). */
  group?: string;
  /** Слот установки, например «Орудие». */
  slot?: string;
  requiredLevel?: number;
  stats: WeaponStats;
  buyPrice?: Price;
  sellPrice?: Price;
  /** Крафтится из чертежей — список названий. */
  craftFromBlueprints?: string[];
  description?: string;
  iconPath?: string;
  wikiUrl?: string;
  _meta?: OverlayMeta;
}
