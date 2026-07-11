import type { MouseEvent } from 'react';
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

interface RobotCardProps {
  robot: Robot;
  isFavorite: boolean;
  onToggleFavorite: (robotKey: string) => void;
  onClick: (robot: Robot) => void;
}

const STAT_ROWS: Array<{ label: string; getValue: (r: Robot) => number | string }> = [
  { label: 'Прочность', getValue: (r) => r.stats.durability },
  { label: 'Броня', getValue: (r) => r.stats.armor },
  { label: 'Скорость', getValue: (r) => r.stats.speed },
  { label: 'Вместимость', getValue: (r) => r.stats.capacity },
];

export function RobotCard({ robot, isFavorite, onToggleFavorite, onClick }: RobotCardProps) {
  const handleStarClick = (e: MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(robot.key);
  };

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
            height: 120,
            bgcolor: 'grey.100',
          }}
        >
          <SmartToy sx={{ fontSize: 72, color: 'grey.400' }} />
        </Box>
        <CardContent>
          <Typography variant="h6" component="div" gutterBottom noWrap>
            {robot.name}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
            <Chip label={robot.type} size="small" />
            <Chip label={`Ур. ${robot.requiredLevel}`} size="small" variant="outlined" />
          </Stack>
          <Stack spacing={0.5}>
            {STAT_ROWS.map(({ label, getValue }) => (
              <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  {label}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {getValue(robot)}
                </Typography>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
