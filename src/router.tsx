import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { CatalogsHubPage } from './pages/CatalogsHubPage';
import { MechsCatalogPage } from './pages/catalogs/MechsCatalogPage';
import { CatalogStubPage } from './pages/catalogs/CatalogStubPage';

const basename = process.env.NODE_ENV === 'production' ? '/mechs-assistant' : undefined;

interface CatalogStub {
  path: string;
  crumb: string;
  title: string;
}

const STUB_CATALOGS: CatalogStub[] = [
  { path: 'weapons-catalog',    crumb: 'Оружие',      title: 'Каталог оружия' },
  { path: 'equipment-catalog',  crumb: 'Оборудование', title: 'Каталог оборудования' },
  { path: 'ammo-catalog',       crumb: 'Боезапасы',   title: 'Каталог боезапасов' },
  { path: 'items-catalog',      crumb: 'Предметы',    title: 'Каталог используемых предметов' },
  { path: 'loot-catalog',       crumb: 'Лут',         title: 'Каталог лута' },
  { path: 'blueprints-catalog', crumb: 'Чертежи',     title: 'Каталог чертежей' },
  { path: 'ore-catalog',        crumb: 'Ископаемое',  title: 'Каталог полезных ископаемых' },
  { path: 'components-catalog', crumb: 'Компоненты',  title: 'Каталог компонентов' },
  { path: 'currencies-catalog', crumb: 'Валюта',      title: 'Справочник валют' },
  { path: 'skills-catalog',     crumb: 'Навыки',      title: 'Каталог навыков' },
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
