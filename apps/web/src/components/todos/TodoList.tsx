import { useEffect, useMemo } from 'react';
import { Alert, Button, CircularProgress, Typography } from '@mui/material';
import { OpenInNew } from '@mui/icons-material';
import { useTodosStore } from '@/stores/todos/store';
import { TODO_PRIORITIES, type Todo, type TodoPriority } from '@/types/todo';
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

  const { active, done } = useMemo(() => {
    const active: Todo[] = [];
    const done: Todo[] = [];
    for (const t of todos) (t.status === 'Готово' ? done : active).push(t);
    return { active, done };
  }, [todos]);

  const grouped = useMemo(() => {
    const map = new Map<TodoPriority, Todo[]>();
    for (const p of TODO_PRIORITIES) map.set(p, []);
    for (const t of active) map.get(t.priority)?.push(t);
    return map;
  }, [active]);

  const doneSorted = useMemo(
    () =>
      [...done].sort(
        (a, b) => TODO_PRIORITIES.indexOf(a.priority) - TODO_PRIORITIES.indexOf(b.priority)
      ),
    [done]
  );

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
        <>
          {TODO_PRIORITIES.map((priority) => {
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
          })}

          {doneSorted.length > 0 && (
            <Section>
              <SectionTitle>Выполненные тикеты ({doneSorted.length})</SectionTitle>
              <CardList>
                {doneSorted.map((t) => (
                  <TodoCard key={t.key} todo={t} />
                ))}
              </CardList>
            </Section>
          )}
        </>
      )}
    </Page>
  );
}
