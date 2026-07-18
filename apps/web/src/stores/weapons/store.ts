import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { StoreApi } from 'zustand';
import type { Weapon } from '@/types/weapon';
// Merged JSON (parsed + overrides + _meta), генерируется scripts/build-data
// перед rspack build. Alias `@build` см. rspack.config.js / tsconfig.json.
import weaponsData from '@build/data/weapons.json';
import { indexedDBMiddleware } from '@/stores/indexedDBMiddleware';

interface WeaponsState {
  weapons: Weapon[];
  favorites: string[];
  /** Флаг: гидратация из IndexedDB завершена (успешно или пусто). */
  _persistHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  initializeWeapons: () => void;
  toggleFavorite: (weaponKey: string) => void;
  reorderFavorites: (newOrder: string[]) => void;
}

export const useWeaponsStore = create<WeaponsState>()(
  devtools(
    indexedDBMiddleware<WeaponsState>({
      // Отдельная БД от мехов — избранное weapons независимо от robots,
      // не нужно вести общий версионинг object stores.
      dbName: 'mechs-assistant-weapons',
      dbVersion: 1,
      storeName: 'weapons-store',
      persistKeys: ['favorites'],
    })((set: StoreApi<WeaponsState>['setState'], get: StoreApi<WeaponsState>['getState']) => ({
      weapons: [],
      favorites: [],
      _persistHydrated: false,
      isLoading: false,
      error: null,

      initializeWeapons: () => {
        set({ isLoading: true, error: null });
        try {
          set({
            weapons: weaponsData as Weapon[],
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

      toggleFavorite: (weaponKey: string) => {
        const state = get();
        const idx = state.favorites.indexOf(weaponKey);
        const next =
          idx === -1
            ? [...state.favorites, weaponKey]
            : state.favorites.filter((k) => k !== weaponKey);
        set({ favorites: next });
      },

      reorderFavorites: (newOrder: string[]) => {
        set({ favorites: newOrder });
      },
    })),
    {
      name: 'weapons-store',
    }
  )
);
