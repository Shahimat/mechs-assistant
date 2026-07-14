import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { StoreApi } from 'zustand';
import type { Loot } from '@/types/loot';
import lootData from '@build/data/loot.json';
import { indexedDBMiddleware } from '@/stores/indexedDBMiddleware';

interface LootState {
  loot: Loot[];
  favorites: string[];
  _persistHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  initializeLoot: () => void;
  toggleFavorite: (key: string) => void;
  reorderFavorites: (newOrder: string[]) => void;
}

export const useLootStore = create<LootState>()(
  devtools(
    indexedDBMiddleware<LootState>({
      dbName: 'mechs-assistant-loot',
      dbVersion: 1,
      storeName: 'loot-store',
      persistKeys: ['favorites'],
    })((set: StoreApi<LootState>['setState'], get: StoreApi<LootState>['getState']) => ({
      loot: [],
      favorites: [],
      _persistHydrated: false,
      isLoading: false,
      error: null,

      initializeLoot: () => {
        set({ isLoading: true, error: null });
        try {
          set({
            loot: lootData as Loot[],
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
      name: 'loot-store',
    }
  )
);
