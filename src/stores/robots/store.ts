import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Robot } from '../../types/robot';
import type { RobotCustomization } from './types';
import robotsData from '../../../data/robots.json';

/**
 * Тип для строки транспонированной таблицы
 */
export interface TransposedRow {
  parameter: string;
  [key: string]: string | number | null | undefined;
}

/**
 * Результат трансформации данных роботов
 */
export interface TransposedRobotsData {
  rows: TransposedRow[];
  robots: RobotCustomization[];
}

/**
 * Состояние store для роботов
 */
interface RobotsState {
  /** Исходные данные роботов с кастомизацией */
  robots: RobotCustomization[];
  /** Флаг загрузки */
  isLoading: boolean;
  /** Ошибка загрузки */
  error: string | null;
  /** Инициализация данных */
  initializeRobots: () => void;
  /** Получить транспонированные данные (вычисляемое значение) */
  getTransposedData: () => TransposedRobotsData;
  /** Установить базового робота по ключу */
  setBaseRobot: (key: string) => void;
}

/**
 * Преобразует данные роботов в транспонированный формат
 * (параметры в строках, роботы в столбцах)
 */
export function transposeRobotsData(robots: RobotCustomization[]): TransposedRobotsData {
  const rows: TransposedRow[] = [
    // Базовые параметры (Название и Модель скрыты)
    {
      parameter: 'Тип',
      ...robots.reduce(
        (acc, robot) => {
          acc[robot.key] = robot.type;
          return acc;
        },
        {} as Record<string, unknown>
      ),
    },
    {
      parameter: 'Уровень',
      ...robots.reduce(
        (acc, robot) => {
          acc[robot.key] = robot.requiredLevel;
          return acc;
        },
        {} as Record<string, unknown>
      ),
    },
    // Базовый робот
    {
      parameter: 'Базовый робот',
      ...robots.reduce(
        (acc, robot) => {
          acc[robot.key] = robot.baseRobot;
          return acc;
        },
        {} as Record<string, unknown>
      ),
    },
    // Характеристики
    {
      parameter: 'Прочность',
      ...robots.reduce(
        (acc, robot) => {
          acc[robot.key] = robot.stats.durability;
          return acc;
        },
        {} as Record<string, unknown>
      ),
    },
    {
      parameter: 'Вместимость',
      ...robots.reduce(
        (acc, robot) => {
          acc[robot.key] = robot.stats.capacity;
          return acc;
        },
        {} as Record<string, unknown>
      ),
    },
    {
      parameter: 'Макс. вместимость',
      ...robots.reduce(
        (acc, robot) => {
          acc[robot.key] = robot.stats.maxCapacity ?? '-';
          return acc;
        },
        {} as Record<string, unknown>
      ),
    },
    {
      parameter: 'Скорость',
      ...robots.reduce(
        (acc, robot) => {
          acc[robot.key] = robot.stats.speed;
          return acc;
        },
        {} as Record<string, unknown>
      ),
    },
    {
      parameter: 'Макс. скорость',
      ...robots.reduce(
        (acc, robot) => {
          acc[robot.key] = robot.stats.maxSpeed;
          return acc;
        },
        {} as Record<string, unknown>
      ),
    },
    {
      parameter: 'Броня',
      ...robots.reduce(
        (acc, robot) => {
          acc[robot.key] = robot.stats.armor;
          return acc;
        },
        {} as Record<string, unknown>
      ),
    },
    {
      parameter: 'Поля',
      ...robots.reduce(
        (acc, robot) => {
          acc[robot.key] = robot.stats.energyFields;
          return acc;
        },
        {} as Record<string, unknown>
      ),
    },
    {
      parameter: 'Восстановление/мин',
      ...robots.reduce(
        (acc, robot) => {
          acc[robot.key] = robot.stats.regenerationPerMinute ?? '-';
          return acc;
        },
        {} as Record<string, unknown>
      ),
    },
    {
      parameter: 'Доп. неуязвимость',
      ...robots.reduce(
        (acc, robot) => {
          const value = robot.stats.additionalInvulnerability;
          acc[robot.key] = value != null ? `${value > 0 ? '+' : ''}${value}с` : '-';
          return acc;
        },
        {} as Record<string, unknown>
      ),
    },
    {
      parameter: 'Доп. ускорение',
      ...robots.reduce(
        (acc, robot) => {
          const value = robot.stats.additionalAcceleration;
          acc[robot.key] = value != null ? `${value > 0 ? '+' : ''}${value}с` : '-';
          return acc;
        },
        {} as Record<string, unknown>
      ),
    },
    // Цены
    {
      parameter: 'Цена покупки (бонусы)',
      ...robots.reduce(
        (acc, robot) => {
          acc[robot.key] = robot.buyPrice?.bonds ?? '-';
          return acc;
        },
        {} as Record<string, unknown>
      ),
    },
    {
      parameter: 'Цена покупки (реглы)',
      ...robots.reduce(
        (acc, robot) => {
          acc[robot.key] = robot.buyPrice?.regls ?? '-';
          return acc;
        },
        {} as Record<string, unknown>
      ),
    },
    {
      parameter: 'Цена продажи (бонусы)',
      ...robots.reduce(
        (acc, robot) => {
          acc[robot.key] = robot.sellPrice?.bonds ?? '-';
          return acc;
        },
        {} as Record<string, unknown>
      ),
    },
    {
      parameter: 'Цена продажи (реглы)',
      ...robots.reduce(
        (acc, robot) => {
          acc[robot.key] = robot.sellPrice?.regls ?? '-';
          return acc;
        },
        {} as Record<string, unknown>
      ),
    },
    {
      parameter: 'Прокачка (реглы %)',
      ...robots.reduce(
        (acc, robot) => {
          acc[robot.key] = robot.upgradeReglPercent ? `${robot.upgradeReglPercent}%` : '-';
          return acc;
        },
        {} as Record<string, unknown>
      ),
    },
    {
      parameter: 'Цена для прокачки (бонусы)',
      ...robots.reduce(
        (acc, robot) => {
          acc[robot.key] = robot.upgradePrice?.bonds ?? '-';
          return acc;
        },
        {} as Record<string, unknown>
      ),
    },
    {
      parameter: 'Цена для прокачки (реглы)',
      ...robots.reduce(
        (acc, robot) => {
          acc[robot.key] = robot.upgradePrice?.regls ?? '-';
          return acc;
        },
        {} as Record<string, unknown>
      ),
    },
    {
      parameter: 'Прокачка предметов (%)',
      ...robots.reduce(
        (acc, robot) => {
          acc[robot.key] = robot.itemUpgradePercent ? `${robot.itemUpgradePercent}%` : '-';
          return acc;
        },
        {} as Record<string, unknown>
      ),
    },
    {
      parameter: 'Дополнительные слоты',
      ...robots.reduce(
        (acc, robot) => {
          acc[robot.key] =
            robot.extraSlots && robot.extraSlots.length > 0 ? robot.extraSlots.join(', ') : '-';
          return acc;
        },
        {} as Record<string, unknown>
      ),
    },
    {
      parameter: 'Особенности',
      ...robots.reduce(
        (acc, robot) => {
          acc[robot.key] =
            robot.features && robot.features.length > 0 ? robot.features.join(', ') : '-';
          return acc;
        },
        {} as Record<string, unknown>
      ),
    },
    {
      parameter: 'Урон в спину/бок (%)',
      ...robots.reduce(
        (acc, robot) => {
          acc[robot.key] = robot.backSideDamage != null ? `${robot.backSideDamage}%` : '-';
          return acc;
        },
        {} as Record<string, unknown>
      ),
    },
    {
      parameter: 'Урон от гаубиц (%)',
      ...robots.reduce(
        (acc, robot) => {
          acc[robot.key] = robot.howitzerDamage != null ? `${robot.howitzerDamage}%` : '-';
          return acc;
        },
        {} as Record<string, unknown>
      ),
    },
    {
      parameter: 'Вероятность промаха (%)',
      ...robots.reduce(
        (acc, robot) => {
          acc[robot.key] = robot.missChance != null ? `${robot.missChance}%` : '-';
          return acc;
        },
        {} as Record<string, unknown>
      ),
    },
  ];

  return { rows, robots };
}

/**
 * Store для управления данными роботов
 */
export const useRobotsStore = create<RobotsState>()(
  devtools(
    (set, get) => ({
      robots: [],
      isLoading: false,
      error: null,

      /**
       * Инициализация данных роботов
       */
      initializeRobots: () => {
        set({ isLoading: true, error: null });

        try {
          const robotsDataArray = robotsData as Robot[];

          // Преобразуем Robot[] в RobotCustomization[] с установкой baseRobot
          const robots: RobotCustomization[] = robotsDataArray.map((robot, index) => ({
            ...robot,
            baseRobot: index === 0, // Первый робот - базовый, остальные - нет
          }));

          set({
            robots,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Неизвестная ошибка при загрузке данных';
          set({
            isLoading: false,
            error: errorMessage,
          });
        }
      },

      /**
       * Получить транспонированные данные (вычисляемое значение)
       * Если данные еще не загружены, инициализирует их
       */
      getTransposedData: () => {
        const state = get();
        if (state.robots.length === 0) {
          // Если данных нет, инициализируем
          state.initializeRobots();
          const updatedState = get();
          if (updatedState.robots.length === 0) {
            return { rows: [], robots: [] };
          }
          return transposeRobotsData(updatedState.robots);
        }

        // Вычисляем транспонированные данные на основе текущих robots
        return transposeRobotsData(state.robots);
      },

      /**
       * Установить базового робота по ключу
       * При установке нового базового робота, у всех остальных baseRobot становится false
       */
      setBaseRobot: (key: string) => {
        const state = get();
        const robotExists = state.robots.some((robot) => robot.key === key);
        if (!robotExists) {
          return;
        }

        // Обновляем всех роботов: устанавливаем baseRobot=true только для выбранного
        const updatedRobots = state.robots.map((robot) => ({
          ...robot,
          baseRobot: robot.key === key,
        }));

        set({
          robots: updatedRobots,
        });
      },
    }),
    {
      name: 'robots-store',
    }
  )
);
