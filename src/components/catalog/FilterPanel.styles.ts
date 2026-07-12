import { styled } from '@mui/material/styles';

export const Panel = styled('div')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '2fr 2fr 1fr',
  justifyContent: 'start',
  columnGap: theme.spacing(3),
  rowGap: theme.spacing(1),
  padding: theme.spacing(2, 0),
  marginBottom: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
  borderBottom: `1px solid ${theme.palette.divider}`,
  [theme.breakpoints.between('md', 'lg')]: {
    gridTemplateColumns: '1fr 1fr auto',
  },
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: '1fr',
  },
}));

export const FilterGroup = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  flexWrap: 'nowrap',
  minHeight: 40,
}));

export const FilterLabel = styled('span')(({ theme }) => ({
  ...theme.typography.body2,
  color: theme.palette.text.secondary,
  whiteSpace: 'nowrap',
}));

export const ResetButtonSlot = styled('div', {
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active?: boolean }>(({ active }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'end',
  minHeight: 40,
  visibility: active ? 'visible' : 'hidden',
  pointerEvents: active ? 'auto' : 'none',
}));
