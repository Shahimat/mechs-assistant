import { memo, useState, type MouseEvent } from 'react';
import { CardActionArea, CardContent, Chip } from '@mui/material';
import { StarBorder } from '@mui/icons-material';
import type { Skill } from '@/types/skill';
import { isOverlaidField } from '@/utils/overlay';
import { resolveIconUrl } from '@/utils/icons';
import { OverlayBadge } from '@/components/catalog/OverlayBadge';
import { OverlayPill } from '@/styles/overlay';
import { KIND_LABELS } from './kindLabels';
import {
  StyledCard,
  FavoriteButton,
  StarFilled,
  IconBox,
  IconImage,
  IconPlaceholder,
  Header,
  Name,
  Spacer,
  ChipRow,
  Descr,
} from './SkillCard.styles';

interface SkillCardProps {
  skill: Skill;
  isFavorite: boolean;
  onToggleFavorite: (key: string) => void;
  onClick: (skill: Skill) => void;
}

function SkillCardImpl({ skill, isFavorite, onToggleFavorite, onClick }: SkillCardProps) {
  const [iconFailed, setIconFailed] = useState(false);

  const handleStarClick = (e: MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(skill.key);
  };

  const iconUrl = skill.iconPath ? resolveIconUrl(skill.iconPath) : null;
  const showIcon = iconUrl && !iconFailed;
  const nameOverlaid = isOverlaidField(skill, 'name');
  const affectsPreview = skill.affects.slice(0, 3);
  const affectsMore = skill.affects.length - affectsPreview.length;

  return (
    <StyledCard>
      <FavoriteButton
        aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
        onClick={handleStarClick}
        size="small"
      >
        {isFavorite ? <StarFilled /> : <StarBorder />}
      </FavoriteButton>
      <CardActionArea onClick={() => onClick(skill)} sx={{ height: '100%' }}>
        <IconBox>
          {showIcon ? (
            <IconImage
              src={iconUrl}
              alt={skill.name}
              loading="lazy"
              onError={() => setIconFailed(true)}
            />
          ) : (
            <IconPlaceholder />
          )}
        </IconBox>
        <CardContent>
          <Header>
            <Name>
              <OverlayPill as="span" overlaid={nameOverlaid} size="medium">
                {skill.name}
              </OverlayPill>
            </Name>
            <Spacer />
            <OverlayBadge entity={skill} />
          </Header>
          <ChipRow>
            <Chip
              label={KIND_LABELS[skill.kind]}
              size="small"
              variant="outlined"
              color={isOverlaidField(skill, 'kind') ? 'primary' : 'default'}
            />
            {skill.perStatPercent != null && (
              <Chip
                label={`+${skill.perStatPercent}% / стат`}
                size="small"
                variant="outlined"
                color={isOverlaidField(skill, 'perStatPercent') ? 'primary' : 'default'}
              />
            )}
            {affectsPreview.map((a) => (
              <Chip key={a} label={a} size="small" />
            ))}
            {affectsMore > 0 && <Chip label={`+${affectsMore}`} size="small" />}
          </ChipRow>
          <Descr>{skill.description}</Descr>
        </CardContent>
      </CardActionArea>
    </StyledCard>
  );
}

export const SkillCard = memo(SkillCardImpl);
