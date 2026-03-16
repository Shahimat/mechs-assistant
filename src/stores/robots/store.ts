import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { StoreApi } from 'zustand';
import type { Robot } from '../../types/robot';
import type { RobotCustomization } from './types';
import robotsData from '../../../data/robots.json';
import { indexedDBMiddleware } from './indexedDBMiddleware';

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
  /** Ключ базового робота (null если не установлен) */
  baseRobotKey: string | null;
  /** Ключи избранных роботов */
  favorites: string[];
  /** Флаг: данные загружены из indexedDB (не перезаписывать до этого) */
  _persistHydrated: boolean;
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
  /** Переключить избранное для робота по ключу */
  toggleFavorite: (robotKey: string) => void;
}

/**
 * Преобразует данные роботов в транспонированный формат
 * (параметры в строках, роботы в столбцах)
 */
export function transposeRobotsData(
  robots: RobotCustomization[],
  baseRobotKey: string | null = null,
  favorites: string[] = []
): TransposedRobotsData {
  const favSet = new Set(favorites);

  const rows: TransposedRow[] = [
    {
      parameter: 'Избранное',
      ...robots.reduce(
        (acc, robot) => {
          acc[robot.key] = favSet.has(robot.key);
          return acc;
        },
        {} as Record<string, unknown>
      ),
    },
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
          // Проверяем, является ли этот робот базовым
          const currentBaseRobotKey = baseRobotKey ?? (robots.length > 0 ? robots[0].key : null);
          acc[robot.key] = robot.key === currentBaseRobotKey;
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
    indexedDBMiddleware<RobotsState>({
      dbName: 'mechs-assistant',
      dbVersion: 2,
      storeName: 'robots-store',
      persistKeys: ['baseRobotKey', 'favorites'],
    })(
      (
        set: StoreApi<RobotsState>['setState'],
        get: StoreApi<RobotsState>['getState']
      ) => ({
        robots: [],
        baseRobotKey: null,
        favorites: [],
        _persistHydrated: false,
        isLoading: false,
        error: null,

        /**
         * Инициализация данных роботов
         * baseRobotKey не перезаписывается до завершения загрузки из indexedDB (_persistHydrated)
         */
        initializeRobots: () => {
          set({ isLoading: true, error: null });

          try {
            const robotsDataArray = robotsData as Robot[];
            const state = get();

            // Дефолтный базовый робот — только после гидратации из indexedDB, иначе не трогаем
            const defaultBaseRobotKey =
              state.baseRobotKey ??
              (state._persistHydrated && robotsDataArray.length > 0
                ? robotsDataArray[0].key
                : null);

            const robots: RobotCustomization[] = robotsDataArray;

            set({
              robots,
              baseRobotKey: defaultBaseRobotKey,
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
            return transposeRobotsData(
              updatedState.robots,
              updatedState.baseRobotKey,
              updatedState.favorites
            );
          }

          return transposeRobotsData(state.robots, state.baseRobotKey, state.favorites);
        },

        /**
         * Установить базового робота по ключу
         * Обновляет baseRobotKey в состоянии (middleware автоматически сохранит в indexedDB)
         */
        setBaseRobot: (key: string) => {
          const state = get();
          const robotExists = state.robots.some((robot: RobotCustomization) => robot.key === key);
          if (!robotExists) {
            return;
          }

          // Обновляем baseRobotKey в состоянии
          // Middleware автоматически сохранит его в indexedDB
          // Роботы не изменяются, меняется только baseRobotKey в состоянии
          set({
            baseRobotKey: key,
          });
        },

        toggleFavorite: (robotKey: string) => {
          const state = get();
          const idx = state.favorites.indexOf(robotKey);
          const next =
            idx === -1
              ? [...state.favorites, robotKey]
              : state.favorites.filter((k) => k !== robotKey);
          set({ favorites: next });
        },
      })
    ),
    {
      name: 'robots-store',
    }
  )
);
