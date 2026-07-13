import { styled } from '@mui/material/styles';

export const SortableWrapper = styled('div', {
  shouldForwardProp: (prop) => prop !== 'isDragging',
})<{ isDragging?: boolean }>(({ isDragging }) => ({
  touchAction: 'none',
  cursor: isDragging ? 'grabbing' : 'grab',
  opacity: isDragging ? 0.5 : 1,
}));
