import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Robot } from '../types/robot';
import robotsData from '../../data/robots.json';

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
  robots: Robot[];
}

/**
 * Состояние store для роботов
 */
interface RobotsState {
  /** Исходные данные роботов */
  robots: Robot[];
  /** Флаг загрузки */
  isLoading: boolean;
  /** Ошибка загрузки */
  error: string | null;
  /** Инициализация данных */
  initializeRobots: () => void;
  /** Получить транспонированные данные (вычисляемое значение) */
  getTransposedData: () => TransposedRobotsData;
}

/**
 * Преобразует данные роботов в транспонированный формат
 * (параметры в строках, роботы в столбцах)
 */
export function transposeRobotsData(robots: Robot[]): TransposedRobotsData {
  const rows: TransposedRow[] = [];

  // Базовые параметры (Название и Модель скрыты)
  rows.push({
    parameter: 'Тип',
    ...robots.reduce((acc, robot, index) => {
      acc[`robot_${index}`] = robot.type;
      return acc;
    }, {} as Record<string, unknown>),
  });

  rows.push({
    parameter: 'Уровень',
    ...robots.reduce((acc, robot, index) => {
      acc[`robot_${index}`] = robot.requiredLevel;
      return acc;
    }, {} as Record<string, unknown>),
  });

  // Характеристики
  rows.push({
    parameter: 'Прочность',
    ...robots.reduce((acc, robot, index) => {
      acc[`robot_${index}`] = robot.stats.durability;
      return acc;
    }, {} as Record<string, unknown>),
  });

  rows.push({
    parameter: 'Вместимость',
    ...robots.reduce((acc, robot, index) => {
      acc[`robot_${index}`] = robot.stats.capacity;
      return acc;
    }, {} as Record<string, unknown>),
  });

  rows.push({
    parameter: 'Макс. вместимость',
    ...robots.reduce((acc, robot, index) => {
      acc[`robot_${index}`] = robot.stats.maxCapacity ?? '-';
      return acc;
    }, {} as Record<string, unknown>),
  });

  rows.push({
    parameter: 'Скорость',
    ...robots.reduce((acc, robot, index) => {
      acc[`robot_${index}`] = robot.stats.speed;
      return acc;
    }, {} as Record<string, unknown>),
  });

  rows.push({
    parameter: 'Макс. скорость',
    ...robots.reduce((acc, robot, index) => {
      acc[`robot_${index}`] = robot.stats.maxSpeed;
      return acc;
    }, {} as Record<string, unknown>),
  });

  rows.push({
    parameter: 'Броня',
    ...robots.reduce((acc, robot, index) => {
      acc[`robot_${index}`] = robot.stats.armor;
      return acc;
    }, {} as Record<string, unknown>),
  });

  rows.push({
    parameter: 'Поля',
    ...robots.reduce((acc, robot, index) => {
      acc[`robot_${index}`] = robot.stats.energyFields;
      return acc;
    }, {} as Record<string, unknown>),
  });

  rows.push({
    parameter: 'Восстановление/мин',
    ...robots.reduce((acc, robot, index) => {
      acc[`robot_${index}`] = robot.stats.regenerationPerMinute ?? '-';
      return acc;
    }, {} as Record<string, unknown>),
  });

  rows.push({
    parameter: 'Доп. неуязвимость',
    ...robots.reduce((acc, robot, index) => {
      const value = robot.stats.additionalInvulnerability;
      acc[`robot_${index}`] = value != null ? `${value > 0 ? '+' : ''}${value}с` : '-';
      return acc;
    }, {} as Record<string, unknown>),
  });

  rows.push({
    parameter: 'Доп. ускорение',
    ...robots.reduce((acc, robot, index) => {
      const value = robot.stats.additionalAcceleration;
      acc[`robot_${index}`] = value != null ? `${value > 0 ? '+' : ''}${value}с` : '-';
      return acc;
    }, {} as Record<string, unknown>),
  });

  // Цены
  rows.push({
    parameter: 'Цена покупки (бонусы)',
    ...robots.reduce((acc, robot, index) => {
      acc[`robot_${index}`] = robot.buyPrice?.bonds ?? '-';
      return acc;
    }, {} as Record<string, unknown>),
  });

  rows.push({
    parameter: 'Цена покупки (реглы)',
    ...robots.reduce((acc, robot, index) => {
      acc[`robot_${index}`] = robot.buyPrice?.regls ?? '-';
      return acc;
    }, {} as Record<string, unknown>),
  });

  rows.push({
    parameter: 'Цена продажи (бонусы)',
    ...robots.reduce((acc, robot, index) => {
      acc[`robot_${index}`] = robot.sellPrice?.bonds ?? '-';
      return acc;
    }, {} as Record<string, unknown>),
  });

  rows.push({
    parameter: 'Цена продажи (реглы)',
    ...robots.reduce((acc, robot, index) => {
      acc[`robot_${index}`] = robot.sellPrice?.regls ?? '-';
      return acc;
    }, {} as Record<string, unknown>),
  });

  rows.push({
    parameter: 'Прокачка (реглы %)',
    ...robots.reduce((acc, robot, index) => {
      acc[`robot_${index}`] = robot.upgradeReglPercent ? `${robot.upgradeReglPercent}%` : '-';
      return acc;
    }, {} as Record<string, unknown>),
  });

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
          const robots = robotsData as Robot[];

          set({
            robots,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка при загрузке данных';
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
    }),
    {
      name: 'robots-store',
    }
  )
);
