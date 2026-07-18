import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ItemCard } from './ItemCard';
import type { Item } from '@/types/item';
import { SortableWrapper } from './SortableItemCard.styles';

interface SortableItemCardProps {
  item: Item;
  onToggleFavorite: (key: string) => void;
  onClick: (item: Item) => void;
}

function SortableItemCardImpl({ item, onToggleFavorite, onClick }: SortableItemCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.key,
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
      <ItemCard item={item} isFavorite onToggleFavorite={onToggleFavorite} onClick={onClick} />
    </SortableWrapper>
  );
}

export const SortableItemCard = memo(SortableItemCardImpl);
