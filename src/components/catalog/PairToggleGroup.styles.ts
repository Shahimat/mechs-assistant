import { styled } from '@mui/material/styles';

export const GroupsRow = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  flexWrap: 'wrap',
}));

export const Capsule = styled('div')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'stretch',
  borderRadius: theme.shape.borderRadius * 2,
  overflow: 'hidden',
  border: `1px solid ${theme.palette.divider}`,
  height: 32,
  userSelect: 'none',
}));

export const Half = styled('button', {
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active?: boolean }>(({ theme, active }) => ({
  ...theme.typography.body2,
  fontWeight: 500,
  padding: theme.spacing(0, 1.5),
  minWidth: 60,
  border: 'none',
  outline: 'none',
  cursor: 'pointer',
  transition: 'background-color 120ms ease, color 120ms ease',
  backgroundColor: active ? theme.palette.primary.main : 'transparent',
  color: active ? theme.palette.primary.contrastText : theme.palette.text.secondary,
  '&:hover': {
    backgroundColor: active ? theme.palette.primary.dark : theme.palette.action.hover,
  },
  '&:focus-visible': {
    boxShadow: `inset 0 0 0 2px ${theme.palette.primary.main}`,
  },
}));

export const Divider = styled('span')(({ theme }) => ({
  width: 1,
  backgroundColor: theme.palette.divider,
  flexShrink: 0,
}));
