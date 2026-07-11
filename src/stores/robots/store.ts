import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { StoreApi } from 'zustand';
import type { Robot } from '../../types/robot';
import robotsData from '../../../data/robots.json';
import { indexedDBMiddleware } from './indexedDBMiddleware';

interface RobotsState {
  robots: Robot[];
  favorites: string[];
  /** Флаг: гидратация из IndexedDB завершена (успешно или пусто). */
  _persistHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  initializeRobots: () => void;
  toggleFavorite: (robotKey: string) => void;
  reorderFavorites: (newOrder: string[]) => void;
}

export const useRobotsStore = create<RobotsState>()(
  devtools(
    indexedDBMiddleware<RobotsState>({
      dbName: 'mechs-assistant',
      dbVersion: 2,
      storeName: 'robots-store',
      persistKeys: ['favorites'],
    })(
      (
        set: StoreApi<RobotsState>['setState'],
        get: StoreApi<RobotsState>['getState']
      ) => ({
        robots: [],
        favorites: [],
        _persistHydrated: false,
        isLoading: false,
        error: null,

        initializeRobots: () => {
          set({ isLoading: true, error: null });
          try {
            set({
              robots: robotsData as Robot[],
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

        toggleFavorite: (robotKey: string) => {
          const state = get();
          const idx = state.favorites.indexOf(robotKey);
          const next =
            idx === -1
              ? [...state.favorites, robotKey]
              : state.favorites.filter((k) => k !== robotKey);
          set({ favorites: next });
        },

        reorderFavorites: (newOrder: string[]) => {
          set({ favorites: newOrder });
        },
      })
    ),
    {
      name: 'robots-store',
    }
  )
);
