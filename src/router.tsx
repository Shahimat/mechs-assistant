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
import { CatalogStubPage } from './pages/catalogs/CatalogStubPage';

const basename = process.env.NODE_ENV === 'production' ? '/mechs-assistant' : undefined;

interface CatalogStub {
  path: string;
  crumb: string;
  title: string;
}

const STUB_CATALOGS: CatalogStub[] = [
  { path: 'ammo-catalog', crumb: 'Боезапасы', title: 'Каталог боезапасов' },
  { path: 'items-catalog', crumb: 'Предметы', title: 'Каталог используемых предметов' },
  { path: 'loot-catalog', crumb: 'Лут', title: 'Каталог лута' },
  { path: 'blueprints-catalog', crumb: 'Чертежи', title: 'Каталог чертежей' },
  { path: 'ore-catalog', crumb: 'Руды', title: 'Каталог руд' },
  { path: 'components-catalog', crumb: 'Компоненты', title: 'Каталог компонентов' },
  { path: 'currencies-catalog', crumb: 'Валюта', title: 'Справочник валют' },
  { path: 'skills-catalog', crumb: 'Навыки', title: 'Каталог навыков' },
];

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
            ...EQUIPMENT_ROUTES.map((r) => ({
              path: r.path,
              element: r.element,
              handle: { crumb: r.crumb },
            })),
            ...STUB_CATALOGS.map((c) => ({
              path: c.path,
              element: <CatalogStubPage title={c.title} />,
              handle: { crumb: c.crumb },
            })),
          ],
        },
      ],
    },
  ],
  { basename }
);
