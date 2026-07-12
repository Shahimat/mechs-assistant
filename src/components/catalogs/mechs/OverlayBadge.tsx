import { Tooltip } from '@mui/material';
import type { Robot } from '../../../types/robot';
import { hasAnyOverlay, overlayTooltip } from '../../../utils/overlay';
import { BadgeIcon } from './OverlayBadge.styles';

interface OverlayBadgeProps {
  robot: Robot;
  size?: 'small' | 'medium';
}

export function OverlayBadge({ robot, size = 'small' }: OverlayBadgeProps) {
  if (!hasAnyOverlay(robot)) return null;
  return (
    <Tooltip title={overlayTooltip(robot)} arrow>
      <BadgeIcon compact={size === 'small'} />
    </Tooltip>
  );
}
