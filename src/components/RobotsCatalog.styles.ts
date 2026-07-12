import { styled } from '@mui/material/styles';
import { Container } from '@mui/material';

export const Page = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

export const CenteredPage = styled(Page)({
  display: 'flex',
  justifyContent: 'center',
});

export const Summary = styled('p')(({ theme }) => ({
  ...theme.typography.body2,
  color: theme.palette.text.secondary,
  margin: 0,
  marginBottom: theme.spacing(3),
}));

export const SectionTitle = styled('h2')(({ theme }) => ({
  ...theme.typography.h6,
  margin: 0,
  marginBottom: theme.spacing(1.5),
}));

export const Grid = styled('div')(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(2),
  gridTemplateColumns: '1fr',
  [theme.breakpoints.up('sm')]: {
    gridTemplateColumns: 'repeat(2, 1fr)',
  },
  [theme.breakpoints.up('md')]: {
    gridTemplateColumns: 'repeat(3, 1fr)',
  },
  [theme.breakpoints.up('lg')]: {
    gridTemplateColumns: 'repeat(4, 1fr)',
  },
}));

export const FavoritesGrid = styled(Grid)(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

export const SectionDivider = styled('hr')(({ theme }) => ({
  border: 0,
  borderTop: `1px solid ${theme.palette.divider}`,
  marginBottom: theme.spacing(4),
}));

export const SectionHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

export const SectionHeaderTitle = styled('h2')(({ theme }) => ({
  ...theme.typography.h6,
  margin: 0,
}));
