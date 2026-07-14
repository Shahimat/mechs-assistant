import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LootCard } from './LootCard';
import type { Loot } from '@/types/loot';
import { SortableWrapper } from './SortableLootCard.styles';

interface SortableLootCardProps {
  loot: Loot;
  onToggleFavorite: (key: string) => void;
  onClick: (loot: Loot) => void;
}

function SortableLootCardImpl({ loot, onToggleFavorite, onClick }: SortableLootCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: loot.key,
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
      <LootCard loot={loot} isFavorite onToggleFavorite={onToggleFavorite} onClick={onClick} />
    </SortableWrapper>
  );
}

export const SortableLootCard = memo(SortableLootCardImpl);
