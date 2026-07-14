import { styled } from '@mui/material/styles';
import { Container } from '@mui/material';

export const Page = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(6),
}));

export const Header = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(3),
  flexWrap: 'wrap',
}));

export const Section = styled('section')(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

export const SectionTitle = styled('h2')(({ theme }) => ({
  ...theme.typography.h6,
  margin: 0,
  marginBottom: theme.spacing(1.5),
  color: theme.palette.text.primary,
}));

export const CardList = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
}));
