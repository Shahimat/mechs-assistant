/**
 * Типы данных для роботов игры Мехи.Земля
 */

export type RobotType = 'боец' | 'транспортник' | 'добытчик' | 'разведчик';

export interface RobotPrice {
  /** Цена в бонах */
  bonds?: number;
  /** Цена в реглах */
  regls?: number;
}

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
  buyPrice?: RobotPrice;
  /** Цена продажи */
  sellPrice?: RobotPrice;
  /** Цена для прокачки */
  upgradePrice?: RobotPrice;
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
  /** URL изображения (если есть) */
  imageUrl?: string;
  /** URL страницы на вики */
  wikiUrl?: string;
  /** Метаинформация об overlay-полях (заполняется build-time merger). */
  _meta?: RobotMeta;
}

export interface RobotMeta {
  /** Пути полей, переопределённых через overlay (пример: "buyPrice.bonds", "weight"). */
  overlayFields: string[];
  /** Момент последнего изменения overlay-строки в Sheets (ISO). */
  overlayUpdatedAt?: string;
  /** Ссылка на источник — например "google-sheets:mechs!row-42". */
  overlaySource?: string;
}
