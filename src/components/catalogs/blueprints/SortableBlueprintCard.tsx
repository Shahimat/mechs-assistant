import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BlueprintCard } from './BlueprintCard';
import type { Blueprint } from '@/types/blueprint';
import { SortableWrapper } from './SortableBlueprintCard.styles';

interface SortableBlueprintCardProps {
  blueprint: Blueprint;
  onToggleFavorite: (key: string) => void;
  onClick: (blueprint: Blueprint) => void;
}

function SortableBlueprintCardImpl({
  blueprint,
  onToggleFavorite,
  onClick,
}: SortableBlueprintCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: blueprint.key,
  });

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
      <BlueprintCard
        blueprint={blueprint}
        isFavorite
        onToggleFavorite={onToggleFavorite}
        onClick={onClick}
      />
    </SortableWrapper>
  );
}

export const SortableBlueprintCard = memo(SortableBlueprintCardImpl);
