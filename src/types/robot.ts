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
  /** Максимальная вместимость (для добытчиков) */
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
  /** Процент прокачки в реглах */
  upgradeReglPercent?: number;
  /** Описание робота (если есть) */
  description?: string;
  /** URL изображения (если есть) */
  imageUrl?: string;
  /** URL страницы на вики */
  wikiUrl?: string;
}
