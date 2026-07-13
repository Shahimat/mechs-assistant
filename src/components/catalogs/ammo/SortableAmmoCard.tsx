import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AmmoCard } from './AmmoCard';
import type { Ammo } from '@/types/ammo';
import { SortableWrapper } from './SortableAmmoCard.styles';

interface SortableAmmoCardProps {
  item: Ammo;
  onToggleFavorite: (key: string) => void;
  onClick: (item: Ammo) => void;
}

function SortableAmmoCardImpl({ item, onToggleFavorite, onClick }: SortableAmmoCardProps) {
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
      <AmmoCard item={item} isFavorite onToggleFavorite={onToggleFavorite} onClick={onClick} />
    </SortableWrapper>
  );
}

export const SortableAmmoCard = memo(SortableAmmoCardImpl);
