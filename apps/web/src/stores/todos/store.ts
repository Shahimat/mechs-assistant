import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Todo } from '@/types/todo';
import todosData from '@build/data/todos.json';

interface TodosState {
  todos: Todo[];
  isLoading: boolean;
  error: string | null;
  initializeTodos: () => void;
}

/**
 * Стор TODO-списка разработки. В отличие от каталогов — без IndexedDB
 * (нет favorites/DnD/персонального состояния), просто снимок из merged
 * JSON. Синк через `sync:sheets` + `build:data`.
 */
export const useTodosStore = create<TodosState>()(
  devtools(
    (set) => ({
      todos: [],
      isLoading: false,
      error: null,

      initializeTodos: () => {
        set({ isLoading: true, error: null });
        try {
          set({
            todos: todosData as Todo[],
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Неизвестная ошибка при загрузке данных';
          set({ isLoading: false, error: errorMessage });
        }
      },
    }),
    { name: 'todos-store' }
  )
);
