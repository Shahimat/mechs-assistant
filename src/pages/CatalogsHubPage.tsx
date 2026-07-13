import { Container } from '@mui/material';
import mechsIcon from '@img/catalog-icons/mechs.webp';
import weaponsIcon from '@img/catalog-icons/weapons.webp';
import equipmentIcon from '@img/catalog-icons/equipment.webp';
import ammoIcon from '@img/catalog-icons/ammo.webp';
import itemsIcon from '@img/catalog-icons/items.webp';
import lootIcon from '@img/catalog-icons/loot.webp';
import blueprintsIcon from '@img/catalog-icons/blueprints.webp';
import oreIcon from '@img/catalog-icons/ore.webp';
import componentsIcon from '@img/catalog-icons/components.webp';
import currenciesIcon from '@img/catalog-icons/currencies.webp';
import skillsIcon from '@img/catalog-icons/skills.webp';
import { TileGrid } from '@/components/tiles/TileGrid';
import { Tile } from '@/components/tiles/Tile';

const CATALOGS: Array<{ to: string; title: string; icon: string }> = [
  { to: '/catalogs/mechs-catalog', title: 'Мехи', icon: mechsIcon },
  { to: '/catalogs/weapons-catalog', title: 'Оружие', icon: weaponsIcon },
  { to: '/catalogs/equipment-catalog', title: 'Оборудование', icon: equipmentIcon },
  { to: '/catalogs/ammo-catalog', title: 'Боезапасы', icon: ammoIcon },
  { to: '/catalogs/items-catalog', title: 'Предметы', icon: itemsIcon },
  { to: '/catalogs/loot-catalog', title: 'Лут', icon: lootIcon },
  { to: '/catalogs/blueprints-catalog', title: 'Чертежи', icon: blueprintsIcon },
  { to: '/catalogs/ore-catalog', title: 'Ископаемое', icon: oreIcon },
  { to: '/catalogs/components-catalog', title: 'Компоненты', icon: componentsIcon },
  { to: '/catalogs/currencies-catalog', title: 'Валюта', icon: currenciesIcon },
  { to: '/catalogs/skills-catalog', title: 'Навыки', icon: skillsIcon },
];

export function CatalogsHubPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <TileGrid>
        {CATALOGS.map((c) => (
          <Tile
            key={c.to}
            to={c.to}
            title={c.title}
            icon={<img src={c.icon} alt="" draggable={false} />}
          />
        ))}
      </TileGrid>
    </Container>
  );
}
