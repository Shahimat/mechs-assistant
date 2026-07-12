import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RobotCard } from './RobotCard';
import type { Robot } from '../types/robot';
import { SortableWrapper } from './SortableRobotCard.styles';

interface SortableRobotCardProps {
  robot: Robot;
  onToggleFavorite: (robotKey: string) => void;
  onClick: (robot: Robot) => void;
}

export function SortableRobotCard({
  robot,
  onToggleFavorite,
  onClick,
}: SortableRobotCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: robot.key });

  return (
    <SortableWrapper
      ref={setNodeRef}
      isDragging={isDragging}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
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
    </SortableWrapper>
  );
}
