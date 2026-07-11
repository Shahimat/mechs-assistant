import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box } from '@mui/material';
import { RobotCard } from './RobotCard';
import type { Robot } from '../types/robot';

interface SortableRobotCardProps {
  robot: Robot;
  onToggleFavorite: (robotKey: string) => void;
  onClick: (robot: Robot) => void;
}

/**
 * Обёртка над RobotCard для drag-and-drop через @dnd-kit/sortable.
 * Используется только для блока избранных. Клик по карточке открывает
 * детализацию — drag активируется после смещения на 8px, чтобы не
 * конфликтовать с обычными кликами и клик по звёздочке.
 */
export function SortableRobotCard({
  robot,
  onToggleFavorite,
  onClick,
}: SortableRobotCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: robot.key });

  return (
    <Box
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
      }}
      {...attributes}
      {...listeners}
    >
      <RobotCard
        robot={robot}
        isFavorite
        onToggleFavorite={onToggleFavorite}
        onClick={onClick}
      />
    </Box>
  );
}
