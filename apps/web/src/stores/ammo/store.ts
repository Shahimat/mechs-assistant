import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { StoreApi } from 'zustand';
import type { Ammo } from '@/types/ammo';
import ammoData from '@build/data/ammo.json';
import { indexedDBMiddleware } from '@/stores/indexedDBMiddleware';

interface AmmoState {
  ammo: Ammo[];
  favorites: string[];
  _persistHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  initializeAmmo: () => void;
  toggleFavorite: (key: string) => void;
  reorderFavorites: (newOrder: string[]) => void;
}

export const useAmmoStore = create<AmmoState>()(
  devtools(
    indexedDBMiddleware<AmmoState>({
      // Отдельная БД: избранное ammo независимо от robots/weapons/equipment.
      dbName: 'mechs-assistant-ammo',
      dbVersion: 1,
      storeName: 'ammo-store',
      persistKeys: ['favorites'],
    })((set: StoreApi<AmmoState>['setState'], get: StoreApi<AmmoState>['getState']) => ({
      ammo: [],
      favorites: [],
      _persistHydrated: false,
      isLoading: false,
      error: null,

      initializeAmmo: () => {
        set({ isLoading: true, error: null });
        try {
          set({
            ammo: ammoData as Ammo[],
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
      name: 'ammo-store',
    }
  )
);
