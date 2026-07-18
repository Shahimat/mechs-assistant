import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { StoreApi } from 'zustand';
import type { Item } from '@/types/item';
import itemsData from '@build/data/items.json';
import { indexedDBMiddleware } from '@/stores/indexedDBMiddleware';

interface ItemsState {
  items: Item[];
  favorites: string[];
  _persistHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  initializeItems: () => void;
  toggleFavorite: (key: string) => void;
  reorderFavorites: (newOrder: string[]) => void;
}

export const useItemsStore = create<ItemsState>()(
  devtools(
    indexedDBMiddleware<ItemsState>({
      // Отдельная БД: избранное items независимо от прочих каталогов.
      dbName: 'mechs-assistant-items',
      dbVersion: 1,
      storeName: 'items-store',
      persistKeys: ['favorites'],
    })((set: StoreApi<ItemsState>['setState'], get: StoreApi<ItemsState>['getState']) => ({
      items: [],
      favorites: [],
      _persistHydrated: false,
      isLoading: false,
      error: null,

      initializeItems: () => {
        set({ isLoading: true, error: null });
        try {
          set({
            items: itemsData as Item[],
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
      name: 'items-store',
    }
  )
);
