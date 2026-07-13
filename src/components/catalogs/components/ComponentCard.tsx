import { memo, useState, type MouseEvent } from 'react';
import { CardActionArea, CardContent, Typography, Chip } from '@mui/material';
import { StarBorder } from '@mui/icons-material';
import type { Component } from '@/types/component';
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
  StatList,
  StatRow,
} from './ComponentCard.styles';

interface ComponentCardProps {
  component: Component;
  isFavorite: boolean;
  onToggleFavorite: (key: string) => void;
  onClick: (component: Component) => void;
}

function formatBonds(v: number): string {
  return `${v.toLocaleString('ru-RU')} бонов`;
}

function ComponentCardImpl({
  component,
  isFavorite,
  onToggleFavorite,
  onClick,
}: ComponentCardProps) {
  const [iconFailed, setIconFailed] = useState(false);

  const handleStarClick = (e: MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(component.key);
  };

  const iconUrl = component.iconPath ? resolveIconUrl(component.iconPath) : null;
  const showIcon = iconUrl && !iconFailed;
  const nameOverlaid = isOverlaidField(component, 'name');
  const kindLabel = component.kind ? KIND_LABELS[component.kind] : null;

  return (
    <StyledCard>
      <FavoriteButton
        aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
        onClick={handleStarClick}
        size="small"
      >
        {isFavorite ? <StarFilled /> : <StarBorder />}
      </FavoriteButton>
      <CardActionArea onClick={() => onClick(component)} sx={{ height: '100%' }}>
        <IconBox>
          {showIcon ? (
            <IconImage
              src={iconUrl}
              alt={component.name}
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
                {component.name}
              </OverlayPill>
            </Name>
            <Spacer />
            <OverlayBadge entity={component} />
          </Header>
          {kindLabel && (
            <ChipRow>
              <Chip
                label={kindLabel}
                size="small"
                variant="outlined"
                color={isOverlaidField(component, 'kind') ? 'primary' : 'default'}
              />
            </ChipRow>
          )}
          <StatList>
            <StatRow>
              <Typography variant="body2" color="text.secondary">
                Вес
              </Typography>
              <OverlayPill overlaid={isOverlaidField(component, 'stats.weight')}>
                {component.stats.weight}
              </OverlayPill>
            </StatRow>
            {component.sellPrice?.bonds != null && (
              <StatRow>
                <Typography variant="body2" color="text.secondary">
                  Цена продажи
                </Typography>
                <OverlayPill overlaid={isOverlaidField(component, 'sellPrice.bonds')}>
                  {formatBonds(component.sellPrice.bonds)}
                </OverlayPill>
              </StatRow>
            )}
          </StatList>
        </CardContent>
      </CardActionArea>
    </StyledCard>
  );
}

export const ComponentCard = memo(ComponentCardImpl);
