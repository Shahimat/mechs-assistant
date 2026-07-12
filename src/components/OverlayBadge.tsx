import { Tooltip } from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import type { Robot } from '../types/robot';
import { hasAnyOverlay, overlayTooltip } from '../utils/overlay';

interface OverlayBadgeProps {
  robot: Robot;
  size?: 'small' | 'medium';
}

/**
 * Общий индикатор «у этого меха есть overlay-поля» — показывается в
 * шапке карточки/детали. Per-field маркеры (иконки рядом с label) убраны
 * по решению юзера: подсветка значения-«пилюли» + tooltip прямо на ней
 * даёт достаточный сигнал.
 */
export function OverlayBadge({ robot, size = 'small' }: OverlayBadgeProps) {
  if (!hasAnyOverlay(robot)) return null;
  return (
    <Tooltip title={overlayTooltip(robot)} arrow>
      <AutoAwesome
        sx={{
          fontSize: size === 'small' ? '0.95rem' : '1.15rem',
          color: 'primary.light',
          verticalAlign: 'middle',
        }}
      />
    </Tooltip>
  );
}
