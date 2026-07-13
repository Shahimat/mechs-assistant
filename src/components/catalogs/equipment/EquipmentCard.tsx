import { memo, useState, type MouseEvent } from 'react';
import { CardActionArea, CardContent, Typography, Chip } from '@mui/material';
import { StarBorder } from '@mui/icons-material';
import type { Equipment } from '@/types/equipment';
import { isOverlaidField } from '@/utils/overlay';
import { resolveIconUrl } from '@/utils/icons';
import { OverlayBadge } from '@/components/catalog/OverlayBadge';
import { OverlayPill } from '@/styles/overlay';
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
} from './EquipmentCard.styles';

interface EquipmentCardProps {
  item: Equipment;
  isFavorite: boolean;
  onToggleFavorite: (key: string) => void;
  onClick: (item: Equipment) => void;
}

function EquipmentCardImpl({ item, isFavorite, onToggleFavorite, onClick }: EquipmentCardProps) {
  const [iconFailed, setIconFailed] = useState(false);

  const handleStarClick = (e: MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(item.key);
  };

  const iconUrl = item.iconPath ? resolveIconUrl(item.iconPath) : null;
  const showIcon = iconUrl && !iconFailed;
  const nameOverlaid = isOverlaidField(item, 'name');
  const primaryLabel = item.stats.primaryLabel;
  const primaryValue = item.stats.primary;

  return (
    <StyledCard>
      <FavoriteButton
        aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
        onClick={handleStarClick}
        size="small"
      >
        {isFavorite ? <StarFilled /> : <StarBorder />}
      </FavoriteButton>
      <CardActionArea onClick={() => onClick(item)} sx={{ height: '100%' }}>
        <IconBox>
          {showIcon ? (
            <IconImage
              src={iconUrl}
              alt={item.name}
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
                {item.name}
              </OverlayPill>
            </Name>
            <Spacer />
            <OverlayBadge entity={item} />
          </Header>
          <ChipRow>
            {item.requiredLevel != null && (
              <Chip
                label={`Ур. ${item.requiredLevel}`}
                size="small"
                color={isOverlaidField(item, 'requiredLevel') ? 'primary' : 'default'}
                variant={isOverlaidField(item, 'requiredLevel') ? 'filled' : 'outlined'}
              />
            )}
            {item.requiredRobotType && (
              <Chip
                label={item.requiredRobotType}
                size="small"
                variant="outlined"
                color={isOverlaidField(item, 'requiredRobotType') ? 'primary' : 'default'}
              />
            )}
          </ChipRow>
          <StatList>
            {primaryValue != null && primaryLabel && (
              <StatRow>
                <Typography variant="body2" color="text.secondary">
                  {primaryLabel}
                </Typography>
                <OverlayPill overlaid={isOverlaidField(item, 'stats.primary')}>
                  {primaryValue}
                </OverlayPill>
              </StatRow>
            )}
            <StatRow>
              <Typography variant="body2" color="text.secondary">
                Прочность
              </Typography>
              <OverlayPill overlaid={isOverlaidField(item, 'stats.durability')}>
                {item.stats.durability}
              </OverlayPill>
            </StatRow>
            <StatRow>
              <Typography variant="body2" color="text.secondary">
                Вес
              </Typography>
              <OverlayPill overlaid={isOverlaidField(item, 'stats.weight')}>
                {item.stats.weight}
              </OverlayPill>
            </StatRow>
          </StatList>
        </CardContent>
      </CardActionArea>
    </StyledCard>
  );
}

export const EquipmentCard = memo(EquipmentCardImpl);
