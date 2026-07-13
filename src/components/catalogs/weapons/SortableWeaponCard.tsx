import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WeaponCard } from './WeaponCard';
import type { Weapon } from '@/types/weapon';
import { SortableWrapper } from './SortableWeaponCard.styles';

interface SortableWeaponCardProps {
  weapon: Weapon;
  onToggleFavorite: (weaponKey: string) => void;
  onClick: (weapon: Weapon) => void;
}

function SortableWeaponCardImpl({ weapon, onToggleFavorite, onClick }: SortableWeaponCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: weapon.key,
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
      <WeaponCard
        weapon={weapon}
        isFavorite
        onToggleFavorite={onToggleFavorite}
        onClick={onClick}
      />
    </SortableWrapper>
  );
}

export const SortableWeaponCard = memo(SortableWeaponCardImpl);
