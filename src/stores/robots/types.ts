import type { Robot } from '../../types/robot';

/**
 * Расширенный интерфейс робота с дополнительными настройками
 */
export interface RobotCustomization extends Robot {
  /** Признак базового меха (для сравнения) */
  baseRobot: boolean;
}
