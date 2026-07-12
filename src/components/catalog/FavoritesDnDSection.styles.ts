import { styled } from '@mui/material/styles';
import { Grid } from './CatalogGrid.styles';

export const FavoritesGrid = styled(Grid)(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));
