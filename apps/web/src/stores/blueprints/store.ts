import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { StoreApi } from 'zustand';
import type { Blueprint } from '@/types/blueprint';
import blueprintsData from '@build/data/blueprints.json';
import { indexedDBMiddleware } from '@/stores/indexedDBMiddleware';

interface BlueprintsState {
  blueprints: Blueprint[];
  favorites: string[];
  _persistHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  initializeBlueprints: () => void;
  toggleFavorite: (key: string) => void;
  reorderFavorites: (newOrder: string[]) => void;
}

export const useBlueprintsStore = create<BlueprintsState>()(
  devtools(
    indexedDBMiddleware<BlueprintsState>({
      dbName: 'mechs-assistant-blueprints',
      dbVersion: 1,
      storeName: 'blueprints-store',
      persistKeys: ['favorites'],
    })(
      (set: StoreApi<BlueprintsState>['setState'], get: StoreApi<BlueprintsState>['getState']) => ({
        blueprints: [],
        favorites: [],
        _persistHydrated: false,
        isLoading: false,
        error: null,

        initializeBlueprints: () => {
          set({ isLoading: true, error: null });
          try {
            set({
              blueprints: blueprintsData as Blueprint[],
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

        toggleFavorite: (key: string) => {
          const state = get();
          const idx = state.favorites.indexOf(key);
          const next =
            idx === -1 ? [...state.favorites, key] : state.favorites.filter((k) => k !== key);
          set({ favorites: next });
        },

        reorderFavorites: (newOrder: string[]) => {
          set({ favorites: newOrder });
        },
      })
    ),
    {
      name: 'blueprints-store',
    }
  )
);
