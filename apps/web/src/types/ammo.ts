import type { Price, OverlayMeta } from './common';

export interface AmmoStats {
  /** Число выстрелов в боекомплекте («Патроны» на вики) — для ремпушек это «Запчасти». */
  rounds: number;
  weight: number;
}

export interface Ammo {
  key: string;
  name: string;
  /** Семейный префикс без варианта: «Пулемёт», «Пулемёт крупнокалиберный», «Гаубица энрг», «Запчасти». */
  model: string;
  /**
   * CSS-slug основного типа оружия (тот же формат, что `Weapon.category`):
   * bullet / missile / mortar / howitzer / launcher / bullet-heavy /
   * bullet-eng / missile-eng / howitzer-eng / launcher-eng / rk / rk-eng /
   * faser / empp / repair.
   */
  family: string;
  /**
   * Массив CSS-slug'ов совместимого оружия — ключевая связь с
   * `data--weapons-catalog.category`. Собирается из поля «Группа орудий»
   * на вики (несколько `<a>`-тегов внутри одного td без разделителя).
   * Пересекается с `Weapon.category` для поиска совместимости.
   */
  compatibleCategories: string[];
  /** «Патроны» или «Запчасти» (для ремпушек). */
  slot?: string;
  requiredLevel?: number;
  /**
   * Прирост мощности из description (у боеприпасов — прирост урона,
   * у «Запчастей» — прирост эффективности ремонта). Значение из
   * «+N мощности»; для «стандартной мощности» = 0. UI показывает
   * «Урон +N» / «Ремонт +N» (по `family === 'repair'`).
   */
  powerBonus?: number;
  stats: AmmoStats;
  buyPrice?: Price;
  sellPrice?: Price;
  description?: string;
  iconPath?: string;
  wikiUrl?: string;
  _meta?: OverlayMeta;
}
