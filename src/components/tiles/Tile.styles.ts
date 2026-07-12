import { styled } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';

export const TileLink = styled(RouterLink)(({ theme }) => ({
  aspectRatio: '1 / 1',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  color: theme.palette.text.primary,
  textDecoration: 'none',
  cursor: 'pointer',
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
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.primary.main,
  '& > svg': {
    fontSize: '3.5rem',
  },
  '& > img': {
    maxWidth: '60%',
    maxHeight: '60%',
    objectFit: 'contain',
  },
}));

export const TileTitle = styled('span')(({ theme }) => ({
  ...theme.typography.h6,
  textAlign: 'center',
  color: theme.palette.text.primary,
}));
