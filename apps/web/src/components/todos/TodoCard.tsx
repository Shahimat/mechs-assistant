import { Chip } from '@mui/material';
import type { Todo, TodoStatus } from '@/types/todo';
import { CardRoot, HeaderRow, TextRow, Meta, Note } from './TodoCard.styles';

interface TodoCardProps {
  todo: Todo;
}

const STATUS_COLOR: Record<TodoStatus, 'default' | 'warning' | 'success'> = {
  Новая: 'default',
  'В работе': 'warning',
  Готово: 'success',
};

export function TodoCard({ todo }: TodoCardProps) {
  const chipColor = STATUS_COLOR[todo.status] ?? 'default';
  return (
    <CardRoot variant="outlined">
      <HeaderRow>
        <TextRow>{todo.text}</TextRow>
        <Chip
          label={todo.status}
          size="small"
          color={chipColor}
          variant={chipColor === 'default' ? 'outlined' : 'filled'}
        />
      </HeaderRow>
      {todo.createdAt && <Meta>Заведена: {todo.createdAt}</Meta>}
      {todo.note && <Note>{todo.note}</Note>}
    </CardRoot>
  );
}
