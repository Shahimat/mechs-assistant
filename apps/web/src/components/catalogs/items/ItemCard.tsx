import { memo, useState, type MouseEvent } from 'react';
import { CardActionArea, CardContent, Typography, Chip } from '@mui/material';
import { StarBorder } from '@mui/icons-material';
import type { Item } from '@/types/item';
import { isOverlaidField } from '@/utils/overlay';
import { resolveIconUrl } from '@/utils/icons';
import { OverlayBadge } from '@/components/catalog/OverlayBadge';
import { OverlayPill } from '@/styles/overlay';
import { SUBTYPE_LABELS, PRIMARY_STAT } from './subtypeLabels';
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
  StatValueEllipsis,
} from './ItemCard.styles';

interface ItemCardProps {
  item: Item;
  isFavorite: boolean;
  onToggleFavorite: (key: string) => void;
  onClick: (item: Item) => void;
}

function ItemCardImpl({ item, isFavorite, onToggleFavorite, onClick }: ItemCardProps) {
  const [iconFailed, setIconFailed] = useState(false);

  const handleStarClick = (e: MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(item.key);
  };

  const iconUrl = item.iconPath ? resolveIconUrl(item.iconPath) : null;
  const showIcon = iconUrl && !iconFailed;
  const nameOverlaid = isOverlaidField(item, 'name');
  const primary = PRIMARY_STAT[item.subtype];
  const primaryValue = primary ? primary.getValue(item) : null;

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
            <Chip
              label={SUBTYPE_LABELS[item.subtype] ?? item.subtype}
              size="small"
              variant="outlined"
              color={isOverlaidField(item, 'subtype') ? 'primary' : 'default'}
            />
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
            {primary && primaryValue != null && (
              <StatRow>
                <Typography variant="body2" color="text.secondary">
                  {primary.label}
                </Typography>
                <OverlayPill overlaid={isOverlaidField(item, primary.path)}>
                  <StatValueEllipsis title={String(primaryValue)}>{primaryValue}</StatValueEllipsis>
                </OverlayPill>
              </StatRow>
            )}
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

export const ItemCard = memo(ItemCardImpl);
