import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EquipmentCard } from './EquipmentCard';
import type { Equipment } from '@/types/equipment';
import { SortableWrapper } from './SortableEquipmentCard.styles';

interface SortableEquipmentCardProps {
  item: Equipment;
  onToggleFavorite: (key: string) => void;
  onClick: (item: Equipment) => void;
}

function SortableEquipmentCardImpl({
  item,
  onToggleFavorite,
  onClick,
}: SortableEquipmentCardProps) {
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
      <EquipmentCard item={item} isFavorite onToggleFavorite={onToggleFavorite} onClick={onClick} />
    </SortableWrapper>
  );
}

export const SortableEquipmentCard = memo(SortableEquipmentCardImpl);
