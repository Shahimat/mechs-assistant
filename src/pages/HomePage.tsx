import { Container, Typography } from '@mui/material';
import { LibraryBooks } from '@mui/icons-material';
import { TileGrid } from '../components/tiles/TileGrid';
import { Tile } from '../components/tiles/Tile';

export function HomePage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Мехи.Земля — Ассистент
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Разделы приложения. По мере роста MVP появятся новые плитки.
      </Typography>
      <TileGrid>
        <Tile to="/catalogs" title="Каталоги" icon={<LibraryBooks />} />
      </TileGrid>
    </Container>
  );
}
