import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SkillCard } from './SkillCard';
import type { Skill } from '@/types/skill';
import { SortableWrapper } from './SortableSkillCard.styles';

interface SortableSkillCardProps {
  skill: Skill;
  onToggleFavorite: (key: string) => void;
  onClick: (skill: Skill) => void;
}

function SortableSkillCardImpl({ skill, onToggleFavorite, onClick }: SortableSkillCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: skill.key,
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
      <SkillCard skill={skill} isFavorite onToggleFavorite={onToggleFavorite} onClick={onClick} />
    </SortableWrapper>
  );
}

export const SortableSkillCard = memo(SortableSkillCardImpl);
