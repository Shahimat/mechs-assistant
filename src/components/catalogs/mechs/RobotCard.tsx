import { memo, useState, type MouseEvent } from 'react';
import { CardActionArea, CardContent, Typography, Chip } from '@mui/material';
import { StarBorder } from '@mui/icons-material';
import type { Robot } from '../../../types/robot';
import { isOverlaidField } from '../../../utils/overlay';
import { resolveIconUrl } from '../../../utils/icons';
import { OverlayBadge } from './OverlayBadge';
import { OverlayPill } from '../../../styles/overlay';
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
} from './RobotCard.styles';

interface RobotCardProps {
  robot: Robot;
  isFavorite: boolean;
  onToggleFavorite: (robotKey: string) => void;
  onClick: (robot: Robot) => void;
}

const STAT_ROWS: Array<{
  label: string;
  path: string;
  getValue: (r: Robot) => number | string;
}> = [
  { label: 'Прочность', path: 'stats.durability', getValue: (r) => r.stats.durability },
  { label: 'Броня', path: 'stats.armor', getValue: (r) => r.stats.armor },
  { label: 'Скорость', path: 'stats.speed', getValue: (r) => r.stats.speed },
  { label: 'Вместимость', path: 'stats.capacity', getValue: (r) => r.stats.capacity },
];

function RobotCardImpl({ robot, isFavorite, onToggleFavorite, onClick }: RobotCardProps) {
  const [iconFailed, setIconFailed] = useState(false);

  const handleStarClick = (e: MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(robot.key);
  };

  const iconUrl = robot.iconPath ? resolveIconUrl(robot.iconPath) : null;
  const showIcon = iconUrl && !iconFailed;
  const nameOverlaid = isOverlaidField(robot, 'name');

  return (
    <StyledCard>
      <FavoriteButton
        aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
        onClick={handleStarClick}
        size="small"
      >
        {isFavorite ? <StarFilled /> : <StarBorder />}
      </FavoriteButton>
      <CardActionArea onClick={() => onClick(robot)} sx={{ height: '100%' }}>
        <IconBox>
          {showIcon ? (
            <IconImage
              src={iconUrl}
              alt={robot.name}
              loading="lazy"
              onError={() => setIconFailed(true)}
            />
          ) : (
            <IconPlaceholder />
          )}
        </IconBox>
        <CardContent>
          <Header>
            <Name variant="h6" component="span" noWrap>
              <OverlayPill as="span" overlaid={nameOverlaid} size="medium">
                {robot.name}
              </OverlayPill>
            </Name>
            <Spacer />
            <OverlayBadge robot={robot} />
          </Header>
          <ChipRow>
            <Chip
              label={robot.type}
              size="small"
              color={isOverlaidField(robot, 'type') ? 'primary' : 'default'}
            />
            {robot.requiredLevel != null && (
              <Chip
                label={`Ур. ${robot.requiredLevel}`}
                size="small"
                color={isOverlaidField(robot, 'requiredLevel') ? 'primary' : 'default'}
                variant={isOverlaidField(robot, 'requiredLevel') ? 'filled' : 'outlined'}
              />
            )}
          </ChipRow>
          <StatList>
            {STAT_ROWS.map(({ label, path, getValue }) => {
              const overlaid = isOverlaidField(robot, path);
              return (
                <StatRow key={label}>
                  <Typography variant="body2" color="text.secondary">
                    {label}
                  </Typography>
                  <OverlayPill overlaid={overlaid}>{getValue(robot)}</OverlayPill>
                </StatRow>
              );
            })}
          </StatList>
        </CardContent>
      </CardActionArea>
    </StyledCard>
  );
}

export const RobotCard = memo(RobotCardImpl);
