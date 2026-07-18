import type { ReactNode } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { FavoritesGrid } from './FavoritesDnDSection.styles';

interface FavoritesDnDSectionProps<T> {
  items: T[];
  getKey: (item: T) => string;
  onReorder: (newKeys: string[]) => void;
  renderCard: (item: T) => ReactNode;
}

export function FavoritesDnDSection<T>({
  items,
  getKey,
  onReorder,
  renderCard,
}: FavoritesDnDSectionProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const keys = items.map(getKey);
    const oldIndex = keys.indexOf(String(active.id));
    const newIndex = keys.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(keys, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(getKey)} strategy={rectSortingStrategy}>
        <FavoritesGrid>{items.map((item) => renderCard(item))}</FavoritesGrid>
      </SortableContext>
    </DndContext>
  );
}
