import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { StoreApi } from 'zustand';
import type { Skill } from '@/types/skill';
import skillsData from '@build/data/skills.json';
import { indexedDBMiddleware } from '@/stores/indexedDBMiddleware';

interface SkillsState {
  skills: Skill[];
  favorites: string[];
  _persistHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  initializeSkills: () => void;
  toggleFavorite: (key: string) => void;
  reorderFavorites: (newOrder: string[]) => void;
}

export const useSkillsStore = create<SkillsState>()(
  devtools(
    indexedDBMiddleware<SkillsState>({
      dbName: 'mechs-assistant-skills',
      dbVersion: 1,
      storeName: 'skills-store',
      persistKeys: ['favorites'],
    })((set: StoreApi<SkillsState>['setState'], get: StoreApi<SkillsState>['getState']) => ({
      skills: [],
      favorites: [],
      _persistHydrated: false,
      isLoading: false,
      error: null,

      initializeSkills: () => {
        set({ isLoading: true, error: null });
        try {
          set({
            skills: skillsData as Skill[],
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
      name: 'skills-store',
    }
  )
);
