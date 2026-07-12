import { Container, Typography } from '@mui/material';
import { PrecisionManufacturing } from '@mui/icons-material';
import { TileGrid } from '../components/tiles/TileGrid';
import { Tile } from '../components/tiles/Tile';

export function CatalogsHubPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Каталоги
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Игровые сущности Мехи.Земля. Пока подключён только каталог мехов —
        остальные 10 добавятся по мере готовности парсеров.
      </Typography>
      <TileGrid>
        <Tile
          to="/catalogs/mechs-catalog"
          title="Мехи"
          icon={<PrecisionManufacturing />}
        />
      </TileGrid>
    </Container>
  );
}
