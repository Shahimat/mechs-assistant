import { Container } from '@mui/material';
import catalogsIcon from '@img/catalog-icon.webp';
import { TileGrid } from '@/components/tiles/TileGrid';
import { Tile } from '@/components/tiles/Tile';

export function HomePage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <TileGrid>
        <Tile
          to="/catalogs"
          title="Каталоги"
          icon={<img src={catalogsIcon} alt="" draggable={false} />}
        />
      </TileGrid>
    </Container>
  );
}
