import { Container } from '@mui/material';
import mechsIcon from '@img/catalog-icons/mechs.webp';
import weaponsIcon from '@img/catalog-icons/weapons.webp';
import chipsIcon from '@img/catalog-icons/chips.webp';
import shieldsIcon from '@img/catalog-icons/shields.webp';
import armourIcon from '@img/catalog-icons/armour.webp';
import accumulatorsIcon from '@img/catalog-icons/accumulators.webp';
import reactorsIcon from '@img/catalog-icons/reactors.webp';
import drillsIcon from '@img/catalog-icons/drills.webp';
import cargosIcon from '@img/catalog-icons/cargos.webp';
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

// Порядок плиток задан юзером 2026-07-13. Мехи + оружие + боезапасы + навыки
// как «активная тройка/четвёрка», далее — 7 подкаталогов оборудования блоком
// (броня → щиты → накопители → реакторы → трюма → чипы → буры), потом
// «прочие» справочники по спадающей приоритетности.
const CATALOGS: Array<{ to: string; title: string; icon: string }> = [
  { to: '/catalogs/mechs-catalog', title: 'Мехи', icon: mechsIcon },
  { to: '/catalogs/weapons-catalog', title: 'Оружие', icon: weaponsIcon },
  { to: '/catalogs/ammo-catalog', title: 'Боезапасы', icon: ammoIcon },
  { to: '/catalogs/skills-catalog', title: 'Навыки', icon: skillsIcon },
  { to: '/catalogs/armour-catalog', title: 'Броня', icon: armourIcon },
  { to: '/catalogs/shields-catalog', title: 'Энергощиты', icon: shieldsIcon },
  { to: '/catalogs/accumulators-catalog', title: 'Накопители', icon: accumulatorsIcon },
  { to: '/catalogs/reactors-catalog', title: 'Реакторы', icon: reactorsIcon },
  { to: '/catalogs/cargos-catalog', title: 'Трюма', icon: cargosIcon },
  { to: '/catalogs/chips-catalog', title: 'Чипы', icon: chipsIcon },
  { to: '/catalogs/drills-catalog', title: 'Буры', icon: drillsIcon },
  { to: '/catalogs/items-catalog', title: 'Предметы', icon: itemsIcon },
  { to: '/catalogs/blueprints-catalog', title: 'Чертежи', icon: blueprintsIcon },
  { to: '/catalogs/components-catalog', title: 'Компоненты', icon: componentsIcon },
  { to: '/catalogs/ore-catalog', title: 'Руды', icon: oreIcon },
  { to: '/catalogs/loot-catalog', title: 'Лут', icon: lootIcon },
  { to: '/catalogs/currencies-catalog', title: 'Валюта', icon: currenciesIcon },
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
