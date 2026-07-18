import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ComponentCard } from './ComponentCard';
import type { Component } from '@/types/component';
import { SortableWrapper } from './SortableComponentCard.styles';

interface SortableComponentCardProps {
  component: Component;
  onToggleFavorite: (key: string) => void;
  onClick: (component: Component) => void;
}

function SortableComponentCardImpl({
  component,
  onToggleFavorite,
  onClick,
}: SortableComponentCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: component.key,
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
      <ComponentCard
        component={component}
        isFavorite
        onToggleFavorite={onToggleFavorite}
        onClick={onClick}
      />
    </SortableWrapper>
  );
}

export const SortableComponentCard = memo(SortableComponentCardImpl);
