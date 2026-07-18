import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { StoreApi } from 'zustand';
import type { Equipment } from '@/types/equipment';
// Merged JSON (parsed + overrides + _meta), генерируется scripts/build-data
// перед rspack build. Alias `@build` см. rspack.config.js / tsconfig.json.
import equipmentData from '@build/data/equipment.json';
import { indexedDBMiddleware } from '@/stores/indexedDBMiddleware';

interface EquipmentState {
  equipment: Equipment[];
  favorites: string[];
  _persistHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  initializeEquipment: () => void;
  toggleFavorite: (key: string) => void;
  reorderFavorites: (newOrder: string[]) => void;
}

export const useEquipmentStore = create<EquipmentState>()(
  devtools(
    indexedDBMiddleware<EquipmentState>({
      // Отдельная БД от мехов и оружия. Избранное — общее на все 7 UI-каталогов
      // оборудования (chips/shields/armour/accumulators/reactors/drills/cargos),
      // поэтому один store и один IndexedDB — общий favorites-список.
      dbName: 'mechs-assistant-equipment',
      dbVersion: 1,
      storeName: 'equipment-store',
      persistKeys: ['favorites'],
    })((set: StoreApi<EquipmentState>['setState'], get: StoreApi<EquipmentState>['getState']) => ({
      equipment: [],
      favorites: [],
      _persistHydrated: false,
      isLoading: false,
      error: null,

      initializeEquipment: () => {
        set({ isLoading: true, error: null });
        try {
          set({
            equipment: equipmentData as Equipment[],
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
      name: 'equipment-store',
    }
  )
);
