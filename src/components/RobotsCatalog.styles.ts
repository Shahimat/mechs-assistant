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
  lineHeight: '40px',
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
  marginBottom: theme.spacing(2),
}));

export const FiltersPanel = styled('div')(({ theme }) => ({
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

export const LevelLabel = styled(FilterLabel)({
  minWidth: 140,
  fontVariantNumeric: 'tabular-nums',
});

export const LevelSliderWrap = styled('div')(({ theme }) => ({
  width: 340,
  paddingLeft: theme.spacing(1.5),
  paddingRight: theme.spacing(1.5),
  display: 'flex',
  alignItems: 'center',
  height: 40,
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

export const SectionSearch = styled('div')(({ theme }) => ({
  width: 280,
  [theme.breakpoints.down('sm')]: {
    width: '100%',
  },
}));
