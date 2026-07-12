import { useState, type MouseEvent } from 'react';
import {
  Card,
  CardActionArea,
  CardContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Stack,
} from '@mui/material';
import { Star, StarBorder, SmartToy } from '@mui/icons-material';
import type { Robot } from '../types/robot';
import { isOverlaidField } from '../utils/overlay';
import { resolveIconUrl } from '../utils/icons';
import { OverlayBadge } from './OverlayBadge';

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

export function RobotCard({ robot, isFavorite, onToggleFavorite, onClick }: RobotCardProps) {
  const [iconFailed, setIconFailed] = useState(false);

  const handleStarClick = (e: MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(robot.key);
  };

  const iconUrl = robot.iconPath ? resolveIconUrl(robot.iconPath) : null;
  const showIcon = iconUrl && !iconFailed;

  return (
    <Card sx={{ position: 'relative', height: '100%' }}>
      <IconButton
        aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
        onClick={handleStarClick}
        sx={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }}
        size="small"
      >
        {isFavorite ? <Star sx={{ color: '#ffc107' }} /> : <StarBorder />}
      </IconButton>
      <CardActionArea onClick={() => onClick(robot)} sx={{ height: '100%' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 180,
            bgcolor: 'action.hover',
          }}
        >
          {showIcon ? (
            <Box
              component="img"
              src={iconUrl}
              alt={robot.name}
              loading="lazy"
              onError={() => setIconFailed(true)}
              sx={{
                width: '85%',
                height: '85%',
                objectFit: 'contain',
                imageRendering: 'high-quality',
              }}
            />
          ) : (
            <SmartToy sx={{ fontSize: 108, color: 'action.disabled' }} />
          )}
        </Box>
        <CardContent>
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            sx={{ mb: 0.5, minWidth: 0 }}
          >
            <Typography
              variant="h6"
              component="span"
              noWrap
              sx={{
                display: 'inline-block',
                minWidth: 0,
                color: isOverlaidField(robot, 'name') ? 'primary.contrastText' : 'inherit',
                bgcolor: isOverlaidField(robot, 'name') ? 'primary.main' : 'transparent',
                px: isOverlaidField(robot, 'name') ? 1 : 0,
                borderRadius: isOverlaidField(robot, 'name') ? 1 : 0,
              }}
            >
              {robot.name}
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <OverlayBadge robot={robot} />
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
            <Chip
              label={robot.type}
              size="small"
              color={isOverlaidField(robot, 'type') ? 'primary' : 'default'}
              variant={isOverlaidField(robot, 'type') ? 'filled' : 'filled'}
            />
            {robot.requiredLevel != null && (
              <Chip
                label={`Ур. ${robot.requiredLevel}`}
                size="small"
                color={isOverlaidField(robot, 'requiredLevel') ? 'primary' : 'default'}
                variant={isOverlaidField(robot, 'requiredLevel') ? 'filled' : 'outlined'}
              />
            )}
          </Stack>
          <Stack spacing={0.5}>
            {STAT_ROWS.map(({ label, path, getValue }) => {
              const overlaid = isOverlaidField(robot, path);
              return (
                <Box
                  key={label}
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {label}
                  </Typography>
                  <Box
                    component="span"
                    sx={{
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      color: overlaid ? 'primary.contrastText' : 'inherit',
                      bgcolor: overlaid ? 'primary.main' : 'transparent',
                      px: overlaid ? 1 : 0,
                      borderRadius: overlaid ? 1 : 0,
                      lineHeight: 1.6,
                    }}
                  >
                    {getValue(robot)}
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
