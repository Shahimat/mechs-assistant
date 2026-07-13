import { memo, useState, type MouseEvent } from 'react';
import { CardActionArea, CardContent, Typography, Chip } from '@mui/material';
import { StarBorder } from '@mui/icons-material';
import type { Weapon } from '@/types/weapon';
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
} from './WeaponCard.styles';

interface WeaponCardProps {
  weapon: Weapon;
  isFavorite: boolean;
  onToggleFavorite: (weaponKey: string) => void;
  onClick: (weapon: Weapon) => void;
}

const formatDamage = (w: Weapon): string =>
  w.stats.damageMin === w.stats.damageMax
    ? String(w.stats.damageMin)
    : `${w.stats.damageMin}–${w.stats.damageMax}`;

const STAT_ROWS: Array<{
  label: string;
  path: string;
  getValue: (w: Weapon) => number | string;
}> = [
  { label: 'Урон', path: 'stats.damageMin', getValue: formatDamage },
  { label: 'Дальность', path: 'stats.range', getValue: (w) => w.stats.range },
  {
    label: 'Скорострельность',
    path: 'stats.rateOfFire',
    getValue: (w) => `${w.stats.rateOfFire}/мин`,
  },
  { label: 'Прочность', path: 'stats.durability', getValue: (w) => w.stats.durability },
];

function WeaponCardImpl({ weapon, isFavorite, onToggleFavorite, onClick }: WeaponCardProps) {
  const [iconFailed, setIconFailed] = useState(false);

  const handleStarClick = (e: MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(weapon.key);
  };

  const iconUrl = weapon.iconPath ? resolveIconUrl(weapon.iconPath) : null;
  const showIcon = iconUrl && !iconFailed;
  const nameOverlaid = isOverlaidField(weapon, 'name');

  return (
    <StyledCard>
      <FavoriteButton
        aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
        onClick={handleStarClick}
        size="small"
      >
        {isFavorite ? <StarFilled /> : <StarBorder />}
      </FavoriteButton>
      <CardActionArea onClick={() => onClick(weapon)} sx={{ height: '100%' }}>
        <IconBox>
          {showIcon ? (
            <IconImage
              src={iconUrl}
              alt={weapon.name}
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
                {weapon.name}
              </OverlayPill>
            </Name>
            <Spacer />
            <OverlayBadge entity={weapon} />
          </Header>
          <ChipRow>
            {weapon.group && (
              <Chip
                label={weapon.group}
                size="small"
                color={isOverlaidField(weapon, 'group') ? 'primary' : 'default'}
              />
            )}
            {weapon.requiredLevel != null && (
              <Chip
                label={`Ур. ${weapon.requiredLevel}`}
                size="small"
                color={isOverlaidField(weapon, 'requiredLevel') ? 'primary' : 'default'}
                variant={isOverlaidField(weapon, 'requiredLevel') ? 'filled' : 'outlined'}
              />
            )}
          </ChipRow>
          <StatList>
            {STAT_ROWS.map(({ label, path, getValue }) => {
              const overlaid = isOverlaidField(weapon, path);
              return (
                <StatRow key={label}>
                  <Typography variant="body2" color="text.secondary">
                    {label}
                  </Typography>
                  <OverlayPill overlaid={overlaid}>{getValue(weapon)}</OverlayPill>
                </StatRow>
              );
            })}
          </StatList>
        </CardContent>
      </CardActionArea>
    </StyledCard>
  );
}

export const WeaponCard = memo(WeaponCardImpl);
