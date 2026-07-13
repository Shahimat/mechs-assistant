import { Tooltip } from '@mui/material';
import { hasAnyOverlay, overlayTooltip } from '@/utils/overlay';
import { BadgeIcon } from './OverlayBadge.styles';

interface EntityWithMeta {
  _meta?: {
    overlayFields?: string[];
    overlayUpdatedAt?: string;
    overlaySource?: string;
  };
}

interface OverlayBadgeProps {
  entity: EntityWithMeta;
  size?: 'small' | 'medium';
}

export function OverlayBadge({ entity, size = 'small' }: OverlayBadgeProps) {
  if (!hasAnyOverlay(entity)) return null;
  return (
    <Tooltip title={overlayTooltip(entity)} arrow>
      <BadgeIcon compact={size === 'small'} />
    </Tooltip>
  );
}
