import { memo, useState, type MouseEvent } from 'react';
import { CardActionArea, CardContent, Typography } from '@mui/material';
import { StarBorder } from '@mui/icons-material';
import type { Ore } from '@/types/ore';
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
  StatList,
  StatRow,
} from './OreCard.styles';

interface OreCardProps {
  ore: Ore;
  isFavorite: boolean;
  onToggleFavorite: (key: string) => void;
  onClick: (ore: Ore) => void;
}

function formatBonds(v: number): string {
  return `${v.toLocaleString('ru-RU')} бонов`;
}

function OreCardImpl({ ore, isFavorite, onToggleFavorite, onClick }: OreCardProps) {
  const [iconFailed, setIconFailed] = useState(false);

  const handleStarClick = (e: MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(ore.key);
  };

  const iconUrl = ore.iconPath ? resolveIconUrl(ore.iconPath) : null;
  const showIcon = iconUrl && !iconFailed;
  const nameOverlaid = isOverlaidField(ore, 'name');

  return (
    <StyledCard>
      <FavoriteButton
        aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
        onClick={handleStarClick}
        size="small"
      >
        {isFavorite ? <StarFilled /> : <StarBorder />}
      </FavoriteButton>
      <CardActionArea onClick={() => onClick(ore)} sx={{ height: '100%' }}>
        <IconBox>
          {showIcon ? (
            <IconImage
              src={iconUrl}
              alt={ore.name}
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
                {ore.name}
              </OverlayPill>
            </Name>
            <Spacer />
            <OverlayBadge entity={ore} />
          </Header>
          <StatList>
            <StatRow>
              <Typography variant="body2" color="text.secondary">
                Вес
              </Typography>
              <OverlayPill overlaid={isOverlaidField(ore, 'stats.weight')}>
                {ore.stats.weight}
              </OverlayPill>
            </StatRow>
            {ore.sellPrice?.bonds != null && (
              <StatRow>
                <Typography variant="body2" color="text.secondary">
                  Цена продажи
                </Typography>
                <OverlayPill overlaid={isOverlaidField(ore, 'sellPrice.bonds')}>
                  {formatBonds(ore.sellPrice.bonds)}
                </OverlayPill>
              </StatRow>
            )}
          </StatList>
        </CardContent>
      </CardActionArea>
    </StyledCard>
  );
}

export const OreCard = memo(OreCardImpl);
