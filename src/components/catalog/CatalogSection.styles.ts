import { styled } from '@mui/material/styles';

export const SectionHeader = styled('div')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: '1fr',
  },
}));

export const SectionTitle = styled('h2')(({ theme }) => ({
  ...theme.typography.h6,
  margin: 0,
  lineHeight: '40px',
}));

export const SectionSearch = styled('div')(({ theme }) => ({
  width: 280,
  [theme.breakpoints.down('sm')]: {
    width: '100%',
  },
}));

export const SectionDivider = styled('hr')(({ theme }) => ({
  border: 0,
  borderTop: `1px solid ${theme.palette.divider}`,
  marginBottom: theme.spacing(2),
}));
