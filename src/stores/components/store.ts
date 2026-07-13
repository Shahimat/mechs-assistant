import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { StoreApi } from 'zustand';
import type { Component } from '@/types/component';
import componentsData from '@build/data/components.json';
import { indexedDBMiddleware } from '@/stores/indexedDBMiddleware';

interface ComponentsState {
  components: Component[];
  favorites: string[];
  _persistHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  initializeComponents: () => void;
  toggleFavorite: (key: string) => void;
  reorderFavorites: (newOrder: string[]) => void;
}

export const useComponentsStore = create<ComponentsState>()(
  devtools(
    indexedDBMiddleware<ComponentsState>({
      dbName: 'mechs-assistant-components',
      dbVersion: 1,
      storeName: 'components-store',
      persistKeys: ['favorites'],
    })(
      (set: StoreApi<ComponentsState>['setState'], get: StoreApi<ComponentsState>['getState']) => ({
        components: [],
        favorites: [],
        _persistHydrated: false,
        isLoading: false,
        error: null,

        initializeComponents: () => {
          set({ isLoading: true, error: null });
          try {
            set({
              components: componentsData as Component[],
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
      name: 'components-store',
    }
  )
);
