import { styled } from '@mui/material/styles';
import { Card } from '@mui/material';

export const CardRoot = styled(Card)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.75),
}));

export const HeaderRow = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(1),
  flexWrap: 'wrap',
}));

export const TextRow = styled('div')(({ theme }) => ({
  ...theme.typography.body1,
  color: theme.palette.text.primary,
  whiteSpace: 'pre-wrap',
}));

export const Meta = styled('div')(({ theme }) => ({
  ...theme.typography.caption,
  color: theme.palette.text.secondary,
}));

export const Note = styled('div')(({ theme }) => ({
  ...theme.typography.body2,
  color: theme.palette.text.secondary,
  whiteSpace: 'pre-wrap',
  paddingTop: theme.spacing(0.5),
  borderTop: `1px dashed ${theme.palette.divider}`,
  marginTop: theme.spacing(0.5),
}));
