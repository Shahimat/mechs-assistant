import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { CatalogsHubPage } from './pages/CatalogsHubPage';
import { MechsCatalogPage } from './pages/catalogs/MechsCatalogPage';
import { WeaponsCatalogPage } from './pages/catalogs/WeaponsCatalogPage';
import { ChipsCatalogPage } from './pages/catalogs/ChipsCatalogPage';
import { ShieldsCatalogPage } from './pages/catalogs/ShieldsCatalogPage';
import { ArmourCatalogPage } from './pages/catalogs/ArmourCatalogPage';
import { AccumulatorsCatalogPage } from './pages/catalogs/AccumulatorsCatalogPage';
import { ReactorsCatalogPage } from './pages/catalogs/ReactorsCatalogPage';
import { DrillsCatalogPage } from './pages/catalogs/DrillsCatalogPage';
import { CargosCatalogPage } from './pages/catalogs/CargosCatalogPage';
import { AmmoCatalogPage } from './pages/catalogs/AmmoCatalogPage';
import { ItemsCatalogPage } from './pages/catalogs/ItemsCatalogPage';
import { OreCatalogPage } from './pages/catalogs/OreCatalogPage';
import { ComponentsCatalogPage } from './pages/catalogs/ComponentsCatalogPage';
import { LootCatalogPage } from './pages/catalogs/LootCatalogPage';
import { SkillsCatalogPage } from './pages/catalogs/SkillsCatalogPage';
import { BlueprintsCatalogPage } from './pages/catalogs/BlueprintsCatalogPage';

const basename = process.env.NODE_ENV === 'production' ? '/mechs-assistant' : undefined;

interface EquipmentSubRoute {
  path: string;
  crumb: string;
  element: JSX.Element;
}

// 7 UI-каталогов оборудования — узкие срезы единой data--equipment-catalog
// по subtype. Хлебные крошки — русские UI-имена подкатегорий.
const EQUIPMENT_ROUTES: EquipmentSubRoute[] = [
  { path: 'chips-catalog', crumb: 'Чипы', element: <ChipsCatalogPage /> },
  { path: 'shields-catalog', crumb: 'Энергощиты', element: <ShieldsCatalogPage /> },
  { path: 'armour-catalog', crumb: 'Броня', element: <ArmourCatalogPage /> },
  { path: 'accumulators-catalog', crumb: 'Накопители', element: <AccumulatorsCatalogPage /> },
  { path: 'reactors-catalog', crumb: 'Реакторы', element: <ReactorsCatalogPage /> },
  { path: 'drills-catalog', crumb: 'Буры', element: <DrillsCatalogPage /> },
  { path: 'cargos-catalog', crumb: 'Трюма', element: <CargosCatalogPage /> },
];

export const router = createBrowserRouter(
  [
    {
      element: <AppLayout />,
      handle: { crumb: 'Главная' },
      children: [
        { index: true, element: <HomePage /> },
        {
          path: 'catalogs',
          handle: { crumb: 'Каталоги' },
          children: [
            { index: true, element: <CatalogsHubPage /> },
            {
              path: 'mechs-catalog',
              element: <MechsCatalogPage />,
              handle: { crumb: 'Мехи' },
            },
            {
              path: 'weapons-catalog',
              element: <WeaponsCatalogPage />,
              handle: { crumb: 'Оружие' },
            },
            {
              path: 'ammo-catalog',
              element: <AmmoCatalogPage />,
              handle: { crumb: 'Боезапасы' },
            },
            {
              path: 'items-catalog',
              element: <ItemsCatalogPage />,
              handle: { crumb: 'Предметы' },
            },
            {
              path: 'ore-catalog',
              element: <OreCatalogPage />,
              handle: { crumb: 'Руды' },
            },
            {
              path: 'components-catalog',
              element: <ComponentsCatalogPage />,
              handle: { crumb: 'Компоненты' },
            },
            {
              path: 'loot-catalog',
              element: <LootCatalogPage />,
              handle: { crumb: 'Лут' },
            },
            {
              path: 'skills-catalog',
              element: <SkillsCatalogPage />,
              handle: { crumb: 'Навыки' },
            },
            ...EQUIPMENT_ROUTES.map((r) => ({
              path: r.path,
              element: r.element,
              handle: { crumb: r.crumb },
            })),
            {
              path: 'blueprints-catalog',
              element: <BlueprintsCatalogPage />,
              handle: { crumb: 'Чертежи' },
            },
          ],
        },
      ],
    },
  ],
  { basename }
);
