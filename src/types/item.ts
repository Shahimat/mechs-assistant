import type { Price, OverlayMeta } from './common';

export type ItemSubtype =
  'pack' | 'gift' | 'energy' | 'invis' | 'repair' | 'scanner' | 'teleport' | 'upgrade';

/**
 * Прирост к статам навыка от апгрейда — механика «навесить апгрейд на
 * оружие/оборудование = +N к статам навыка X». Overlay-поле: парсер
 * не тянет (на вики только описательная фраза «Микросхема для установки
 * Nй ступени навыков»), заполняется вручную по мере знаний.
 */
export interface ItemProvidesSkill {
  skillKey: string;
  value: number;
}

/**
 * Одна дроп-позиция из полей «Создает» / «Находится в» на вики.
 * В HTML — `<span class="wiki-inline-block">` с иконкой предмета,
 * количеством (`<sub>`) и опциональным шансом (`<sup>`).
 */
export interface LootDrop {
  name: string;
  count: number;
  chance?: string;
}

export interface ItemStats {
  weight: number;
  // subtype-specific optional поля
  /** pack/gift — «Создает», список дропов при активации. */
  creates?: LootDrop[];
  /** gift — «Находится в», где выпадает подарок (тот же формат). */
  createdIn?: LootDrop[];
  /** energy (шокеры) — «Восстанавливает энергии». */
  energyRestored?: number;
  /** invis / scanner — «Энергопотребление». */
  energyConsumption?: number;
  /** repair — «Восстанавливает» (прочность). */
  healing?: number;
  /** repair — «Пауза ремонта». */
  repairPause?: number;
  /** repair — «Пауза ремонта, если не был атакован». */
  repairPauseIfNotAttacked?: number;
  /** scanner — «Радиус сканирования». */
  scanRadius?: number;
  /** scanner — «Время действия». */
  duration?: number;
}

export interface Item {
  key: string;
  name: string;
  model: string;
  subtype: ItemSubtype;
  requiredLevel?: number;
  /** Ограничение по классу меха («Добытчик» / «Разведчик» у сканеров). */
  requiredRobotType?: string;
  stats: ItemStats;
  buyPrice?: Price;
  sellPrice?: Price;
  craftFromBlueprints?: string[];
  description?: string;
  iconPath?: string;
  wikiUrl?: string;
  /**
   * Только для subtype='upgrade' — прирост навыка при навешивании
   * апгрейда на оружие/оборудование. Overlay-only (парсер не тянет).
   */
  providesSkill?: ItemProvidesSkill;
  _meta?: OverlayMeta;
}
