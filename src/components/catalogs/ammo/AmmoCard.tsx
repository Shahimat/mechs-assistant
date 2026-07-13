import { memo, useState, type MouseEvent } from 'react';
import { CardActionArea, CardContent, Typography, Chip } from '@mui/material';
import { StarBorder } from '@mui/icons-material';
import type { Ammo } from '@/types/ammo';
import { isOverlaidField } from '@/utils/overlay';
import { resolveIconUrl } from '@/utils/icons';
import { OverlayBadge } from '@/components/catalog/OverlayBadge';
import { OverlayPill } from '@/styles/overlay';
import { CATEGORY_LABELS } from './categoryLabels';
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
} from './AmmoCard.styles';

interface AmmoCardProps {
  item: Ammo;
  isFavorite: boolean;
  onToggleFavorite: (key: string) => void;
  onClick: (item: Ammo) => void;
}

function labelFor(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

function AmmoCardImpl({ item, isFavorite, onToggleFavorite, onClick }: AmmoCardProps) {
  const [iconFailed, setIconFailed] = useState(false);

  const handleStarClick = (e: MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(item.key);
  };

  const iconUrl = item.iconPath ? resolveIconUrl(item.iconPath) : null;
  const showIcon = iconUrl && !iconFailed;
  const nameOverlaid = isOverlaidField(item, 'name');
  const compatibleOverlaid = isOverlaidField(item, 'compatibleCategories');

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
            {item.compatibleCategories.map((cat) => (
              <Chip
                key={cat}
                label={labelFor(cat)}
                size="small"
                variant="outlined"
                color={compatibleOverlaid ? 'primary' : 'default'}
              />
            ))}
            {item.requiredLevel != null && (
              <Chip
                label={`Ур. ${item.requiredLevel}`}
                size="small"
                color={isOverlaidField(item, 'requiredLevel') ? 'primary' : 'default'}
                variant={isOverlaidField(item, 'requiredLevel') ? 'filled' : 'outlined'}
              />
            )}
          </ChipRow>
          <StatList>
            <StatRow>
              <Typography variant="body2" color="text.secondary">
                {item.family === 'repair' ? 'Ремонт' : 'Урон'}
              </Typography>
              <OverlayPill overlaid={isOverlaidField(item, 'powerBonus')}>
                {item.powerBonus == null || item.powerBonus === 0 ? '—' : `+${item.powerBonus}`}
              </OverlayPill>
            </StatRow>
            <StatRow>
              <Typography variant="body2" color="text.secondary">
                {item.slot === 'Запчасти' ? 'Запчасти' : 'Патроны'}
              </Typography>
              <OverlayPill overlaid={isOverlaidField(item, 'stats.rounds')}>
                {item.stats.rounds}
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

export const AmmoCard = memo(AmmoCardImpl);
