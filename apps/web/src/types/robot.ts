/**
 * Типы данных для роботов игры Мехи.Земля
 */

import type { Price, OverlayMeta } from './common';

export type RobotType = 'боец' | 'транспортник' | 'добытчик' | 'разведчик';

export interface RobotStats {
  /** Прочность (HP) */
  durability: number;
  /** Вместимость (трюм) */
  capacity: number;
  /** Максимальная вместимость под грузом (для транспортников) */
  maxCapacity?: number;
  /** Скорость */
  speed: number;
  /** Максимальная скорость (после прокачки) */
  maxSpeed: number;
  /** Броня */
  armor: number;
  /** Энергетические поля */
  energyFields: number;
  /** Восстановление прочности в минуту */
  regenerationPerMinute?: number;
  /** Добавочная неуязвимость (секунды) */
  additionalInvulnerability?: number;
  /** Добавочное ускорение (секунды) */
  additionalAcceleration?: number;
}

export interface Robot {
  /** Уникальный ключ робота */
  key: string;
  /** Название робота (с уровнем, если вариантов больше одного) */
  name: string;
  /** Модель робота */
  model: string;
  /** Тип робота */
  type: RobotType;
  /** Требуемый уровень персонажа */
  requiredLevel: number;
  /** Характеристики робота */
  stats: RobotStats;
  /** Цена покупки */
  buyPrice?: Price;
  /** Цена продажи */
  sellPrice?: Price;
  /** Цена для прокачки */
  upgradePrice?: Price;
  /** Процент прокачки в реглах */
  upgradeReglPercent?: number;
  /** Процент прокачки предметов */
  itemUpgradePercent?: number;
  /** Дополнительные слоты для установки оборудования */
  extraSlots?: string[];
  /** Особенности робота (например, "Рывок охотника") */
  features?: string[];
  /** Получаемый урон в спину/бок (в процентах, если не указан, то 100%) */
  backSideDamage?: number;
  /** Получаемый урон от гаубиц (в процентах, если не указан, то 100%) */
  howitzerDamage?: number;
  /** Вероятность промаха (в процентах) */
  missChance?: number;
  /** Описание робота (если есть) */
  description?: string;
  /** Путь к иконке (относительно data/icons/, пишет parser--wiki). */
  iconPath?: string;
  /** URL страницы на вики */
  wikiUrl?: string;
  /** Метаинформация об overlay-полях (заполняется build-time merger). */
  _meta?: OverlayMeta;
}
