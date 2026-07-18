import { styled } from '@mui/material/styles';
import { AutoAwesome } from '@mui/icons-material';

export const BadgeIcon = styled(AutoAwesome, {
  shouldForwardProp: (prop) => prop !== 'compact',
})<{ compact?: boolean }>(({ theme, compact }) => ({
  color: theme.palette.primary.light,
  verticalAlign: 'middle',
  fontSize: compact ? '0.95rem' : '1.15rem',
}));
