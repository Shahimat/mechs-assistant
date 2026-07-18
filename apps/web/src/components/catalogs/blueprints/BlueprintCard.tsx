import { memo, useState, type MouseEvent } from 'react';
import { CardActionArea, CardContent, Typography, Chip } from '@mui/material';
import { StarBorder } from '@mui/icons-material';
import type { Blueprint } from '@/types/blueprint';
import { isOverlaidField } from '@/utils/overlay';
import { resolveIconUrl } from '@/utils/icons';
import { lookupName } from '@/utils/crossCatalogLookup';
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
  StatValueEllipsis,
} from './BlueprintCard.styles';

interface BlueprintCardProps {
  blueprint: Blueprint;
  isFavorite: boolean;
  onToggleFavorite: (key: string) => void;
  onClick: (blueprint: Blueprint) => void;
}

function BlueprintCardImpl({
  blueprint,
  isFavorite,
  onToggleFavorite,
  onClick,
}: BlueprintCardProps) {
  const [iconFailed, setIconFailed] = useState(false);

  const handleStarClick = (e: MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(blueprint.key);
  };

  const iconUrl = blueprint.iconPath ? resolveIconUrl(blueprint.iconPath) : null;
  const showIcon = iconUrl && !iconFailed;
  const nameOverlaid = isOverlaidField(blueprint, 'name');

  // Имя целевого предмета — lookup по (producesCatalog, producesKey);
  // если запись не найдена в других каталогах — показываем сырой key.
  const producedName = lookupName(blueprint.producesCatalog, blueprint.producesKey);
  const producedLabel = producedName ?? blueprint.producesKey;

  return (
    <StyledCard>
      <FavoriteButton
        aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
        onClick={handleStarClick}
        size="small"
      >
        {isFavorite ? <StarFilled /> : <StarBorder />}
      </FavoriteButton>
      <CardActionArea onClick={() => onClick(blueprint)} sx={{ height: '100%' }}>
        <IconBox>
          {showIcon ? (
            <IconImage
              src={iconUrl}
              alt={blueprint.name}
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
                {blueprint.name}
              </OverlayPill>
            </Name>
            <Spacer />
            <OverlayBadge entity={blueprint} />
          </Header>
          <ChipRow>
            <Chip
              label={CATEGORY_LABELS[blueprint.category] ?? blueprint.category}
              size="small"
              variant="outlined"
              color={isOverlaidField(blueprint, 'category') ? 'primary' : 'default'}
            />
            {blueprint.subtype && (
              <Chip
                label={blueprint.subtype}
                size="small"
                variant="outlined"
                color={isOverlaidField(blueprint, 'subtype') ? 'primary' : 'default'}
              />
            )}
          </ChipRow>
          <StatList>
            <StatRow>
              <Typography variant="body2" color="text.secondary">
                Создает ×{blueprint.output}
              </Typography>
              <OverlayPill overlaid={isOverlaidField(blueprint, 'producesKey')}>
                <StatValueEllipsis title={producedLabel}>{producedLabel}</StatValueEllipsis>
              </OverlayPill>
            </StatRow>
            <StatRow>
              <Typography variant="body2" color="text.secondary">
                Прочность
              </Typography>
              <OverlayPill overlaid={isOverlaidField(blueprint, 'stats.durability')}>
                {blueprint.stats.durability}
              </OverlayPill>
            </StatRow>
          </StatList>
        </CardContent>
      </CardActionArea>
    </StyledCard>
  );
}

export const BlueprintCard = memo(BlueprintCardImpl);
