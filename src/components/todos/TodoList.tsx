import { useEffect, useMemo } from 'react';
import { Alert, Button, CircularProgress, Typography } from '@mui/material';
import { OpenInNew } from '@mui/icons-material';
import { useTodosStore } from '@/stores/todos/store';
import { TODO_PRIORITIES, type TodoPriority } from '@/types/todo';
import { TODO_SHEET_URL } from '@/config/links';
import { TodoCard } from './TodoCard';
import { Page, Header, Section, SectionTitle, CardList } from './TodoList.styles';

export function TodoList() {
  const { todos, isLoading, error, initializeTodos } = useTodosStore();

  useEffect(() => {
    if (todos.length === 0 && !isLoading) {
      initializeTodos();
    }
  }, [todos.length, isLoading, initializeTodos]);

  const grouped = useMemo(() => {
    const map = new Map<TodoPriority, typeof todos>();
    for (const p of TODO_PRIORITIES) map.set(p, []);
    for (const t of todos) {
      const bucket = map.get(t.priority);
      if (bucket) bucket.push(t);
    }
    return map;
  }, [todos]);

  // URL приходит из env через rspack DefinePlugin; если переменная не
  // задана (пустая строка), кнопка не рендерится — не показываем
  // сломанную ссылку.
  const addTaskButton = TODO_SHEET_URL ? (
    <Button
      variant="outlined"
      size="small"
      endIcon={<OpenInNew fontSize="small" />}
      component="a"
      href={TODO_SHEET_URL}
      target="_blank"
      rel="noopener"
    >
      Предложить задачу
    </Button>
  ) : null;

  if (isLoading) {
    return (
      <Page maxWidth="md">
        <CircularProgress />
      </Page>
    );
  }

  if (error) {
    return (
      <Page maxWidth="md">
        <Alert severity="error">{error}</Alert>
      </Page>
    );
  }

  return (
    <Page maxWidth="md">
      <Header>
        <Typography variant="h5" component="h1">
          Планы разработки
        </Typography>
        {addTaskButton}
      </Header>

      {todos.length === 0 ? (
        <Alert severity="info">Пока нет задач в списке. Предложи первую!</Alert>
      ) : (
        TODO_PRIORITIES.map((priority) => {
          const bucket = grouped.get(priority) ?? [];
          if (bucket.length === 0) return null;
          return (
            <Section key={priority}>
              <SectionTitle>
                {priority} ({bucket.length})
              </SectionTitle>
              <CardList>
                {bucket.map((t) => (
                  <TodoCard key={t.key} todo={t} />
                ))}
              </CardList>
            </Section>
          );
        })
      )}
    </Page>
  );
}
