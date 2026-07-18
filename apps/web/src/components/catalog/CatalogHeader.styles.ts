import { styled } from '@mui/material/styles';

export const Summary = styled('p')(({ theme }) => ({
  ...theme.typography.body2,
  color: theme.palette.text.secondary,
  margin: 0,
  marginBottom: theme.spacing(3),
}));
