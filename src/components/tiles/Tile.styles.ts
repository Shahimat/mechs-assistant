import { styled } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';

export const TileLink = styled(RouterLink)(({ theme }) => ({
  position: 'relative',
  aspectRatio: '1 / 1',
  display: 'block',
  overflow: 'hidden',
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  color: theme.palette.text.primary,
  textDecoration: 'none',
  cursor: 'pointer',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  WebkitTouchCallout: 'none',
  transition: 'transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease',
  outline: 'none',

  '&:hover': {
    transform: 'scale(1.03)',
    boxShadow: theme.shadows[6],
    borderColor: theme.palette.primary.main,
  },

  '&:active': {
    transform: 'scale(0.98)',
    transitionDuration: '80ms',
  },

  '&:focus-visible': {
    boxShadow: `0 0 0 3px ${theme.palette.primary.main}`,
  },
}));

export const IconSlot = styled('div')(({ theme }) => ({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.primary.main,
  '& > svg': {
    fontSize: '6rem',
  },
  '& > img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    pointerEvents: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitUserDrag: 'none',
    KhtmlUserDrag: 'none',
    MozUserDrag: 'none',
    OUserDrag: 'none',
    userDrag: 'none',
  },
}));

export const TileTitle = styled('span')(({ theme }) => ({
  ...theme.typography.h6,
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  padding: theme.spacing(1.5, 2, 2),
  textAlign: 'center',
  color: theme.palette.common.white,
  background:
    'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0) 100%)',
  textShadow: '0 1px 2px rgba(0,0,0,0.6)',
}));
