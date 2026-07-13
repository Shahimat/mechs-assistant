import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { StoreApi } from 'zustand';
import type { Ore } from '@/types/ore';
import oreData from '@build/data/ore.json';
import { indexedDBMiddleware } from '@/stores/indexedDBMiddleware';

interface OreState {
  ore: Ore[];
  favorites: string[];
  _persistHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  initializeOre: () => void;
  toggleFavorite: (key: string) => void;
  reorderFavorites: (newOrder: string[]) => void;
}

export const useOreStore = create<OreState>()(
  devtools(
    indexedDBMiddleware<OreState>({
      dbName: 'mechs-assistant-ore',
      dbVersion: 1,
      storeName: 'ore-store',
      persistKeys: ['favorites'],
    })((set: StoreApi<OreState>['setState'], get: StoreApi<OreState>['getState']) => ({
      ore: [],
      favorites: [],
      _persistHydrated: false,
      isLoading: false,
      error: null,

      initializeOre: () => {
        set({ isLoading: true, error: null });
        try {
          set({
            ore: oreData as Ore[],
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
    })),
    {
      name: 'ore-store',
    }
  )
);
