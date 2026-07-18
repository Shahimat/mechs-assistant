import { Container } from '@mui/material';
import catalogsIcon from '@img/catalog-icon.webp';
import mechCalcIcon from '@img/main-icons/mech-calc.webp';
import statsCalcIcon from '@img/main-icons/stats-calc.webp';
import todoIcon from '@img/main-icons/todo.webp';
import clanStorageIcon from '@img/main-icons/clan-storage.webp';
import { TileGrid } from '@/components/tiles/TileGrid';
import { Tile } from '@/components/tiles/Tile';

// Порядок плиток по решению юзера: сначала справочный слой (MVP1),
// затем клановый инструмент (MVP3), потом игровые калькуляторы (MVP4, MVP2),
// в конце — meta-раздел планов разработки.
const TILES: Array<{ to: string; title: string; icon: string }> = [
  { to: '/catalogs', title: 'Каталоги', icon: catalogsIcon },
  { to: '/warehouse', title: 'Клановый склад', icon: clanStorageIcon },
  { to: '/stats-calculator', title: 'Калькулятор характеристик', icon: statsCalcIcon },
  { to: '/mechs-calculator', title: 'Калькулятор мехов', icon: mechCalcIcon },
  { to: '/todo', title: 'Планы разработки', icon: todoIcon },
];

export function HomePage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <TileGrid>
        {TILES.map((t) => (
          <Tile
            key={t.to}
            to={t.to}
            title={t.title}
            icon={<img src={t.icon} alt="" draggable={false} />}
          />
        ))}
      </TileGrid>
    </Container>
  );
}
