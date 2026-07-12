import { styled } from '@mui/material/styles';

export const OverlayPill = styled('span', {
  shouldForwardProp: (prop) => prop !== 'overlaid',
})<{ overlaid?: boolean; size?: 'small' | 'medium' | 'large' }>(
  ({ theme, overlaid, size = 'small' }) => ({
    display: 'inline-block',
    lineHeight: 1.6,
    fontWeight: 500,
    fontSize: '0.875rem',
    ...(overlaid && {
      color: theme.palette.primary.contrastText,
      backgroundColor: theme.palette.primary.main,
      borderRadius: theme.shape.borderRadius,
      padding:
        size === 'large'
          ? theme.spacing(0.25, 1.5)
          : size === 'medium'
            ? theme.spacing(0, 1)
            : theme.spacing(0, 0.75),
    }),
  })
);
