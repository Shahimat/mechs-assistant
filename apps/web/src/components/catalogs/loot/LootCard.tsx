import { memo, useState, type MouseEvent } from 'react';
import { CardActionArea, CardContent, Typography, Chip } from '@mui/material';
import { StarBorder } from '@mui/icons-material';
import type { Loot } from '@/types/loot';
import { isOverlaidField } from '@/utils/overlay';
import { resolveIconUrl } from '@/utils/icons';
import { OverlayBadge } from '@/components/catalog/OverlayBadge';
import { OverlayPill } from '@/styles/overlay';
import { SOURCE_LABELS } from './sourceLabels';
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
} from './LootCard.styles';

interface LootCardProps {
  loot: Loot;
  isFavorite: boolean;
  onToggleFavorite: (key: string) => void;
  onClick: (loot: Loot) => void;
}

function formatBonds(v: number): string {
  return `${v.toLocaleString('ru-RU')} бонов`;
}

function LootCardImpl({ loot, isFavorite, onToggleFavorite, onClick }: LootCardProps) {
  const [iconFailed, setIconFailed] = useState(false);

  const handleStarClick = (e: MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(loot.key);
  };

  const iconUrl = loot.iconPath ? resolveIconUrl(loot.iconPath) : null;
  const showIcon = iconUrl && !iconFailed;
  const nameOverlaid = isOverlaidField(loot, 'name');
  const sourcesOverlaid = isOverlaidField(loot, 'sources');

  return (
    <StyledCard>
      <FavoriteButton
        aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
        onClick={handleStarClick}
        size="small"
      >
        {isFavorite ? <StarFilled /> : <StarBorder />}
      </FavoriteButton>
      <CardActionArea onClick={() => onClick(loot)} sx={{ height: '100%' }}>
        <IconBox>
          {showIcon ? (
            <IconImage
              src={iconUrl}
              alt={loot.name}
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
                {loot.name}
              </OverlayPill>
            </Name>
            <Spacer />
            <OverlayBadge entity={loot} />
          </Header>
          <ChipRow>
            {loot.sources.map((s) => (
              <Chip
                key={s}
                label={SOURCE_LABELS[s] ?? s}
                size="small"
                variant="outlined"
                color={sourcesOverlaid ? 'primary' : 'default'}
              />
            ))}
          </ChipRow>
          <StatList>
            <StatRow>
              <Typography variant="body2" color="text.secondary">
                Вес
              </Typography>
              <OverlayPill overlaid={isOverlaidField(loot, 'stats.weight')}>
                {loot.stats.weight}
              </OverlayPill>
            </StatRow>
            {loot.sellPrice?.bonds != null && (
              <StatRow>
                <Typography variant="body2" color="text.secondary">
                  Цена продажи
                </Typography>
                <OverlayPill overlaid={isOverlaidField(loot, 'sellPrice.bonds')}>
                  {formatBonds(loot.sellPrice.bonds)}
                </OverlayPill>
              </StatRow>
            )}
          </StatList>
        </CardContent>
      </CardActionArea>
    </StyledCard>
  );
}

export const LootCard = memo(LootCardImpl);
