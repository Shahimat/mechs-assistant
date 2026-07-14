export const TODO_PRIORITIES = ['Блокер', 'Высокий', 'Средний', 'Низкий'] as const;
export type TodoPriority = (typeof TODO_PRIORITIES)[number];

export const TODO_STATUSES = ['Новая', 'В работе', 'Готово'] as const;
export type TodoStatus = (typeof TODO_STATUSES)[number];

export interface Todo {
  /** Позиционный ключ `row-<N>` из парсера — стабильная привязка на время сессии. */
  key: string;
  /** Полный текст задачи. */
  text: string;
  priority: TodoPriority;
  status: TodoStatus;
  /** ISO YYYY-MM-DD. Проставляется парсером автоматически при пустой ячейке. */
  createdAt: string;
  /** Контекст/ссылки/детали — опциональное. */
  note?: string;
}
