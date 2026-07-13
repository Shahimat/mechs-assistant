import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { OreCard } from './OreCard';
import type { Ore } from '@/types/ore';
import { SortableWrapper } from './SortableOreCard.styles';

interface SortableOreCardProps {
  ore: Ore;
  onToggleFavorite: (key: string) => void;
  onClick: (ore: Ore) => void;
}

function SortableOreCardImpl({ ore, onToggleFavorite, onClick }: SortableOreCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ore.key,
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
      <OreCard ore={ore} isFavorite onToggleFavorite={onToggleFavorite} onClick={onClick} />
    </SortableWrapper>
  );
}

export const SortableOreCard = memo(SortableOreCardImpl);
