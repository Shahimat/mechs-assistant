import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { CatalogsHubPage } from './pages/CatalogsHubPage';
import { MechsCatalogPage } from './pages/catalogs/MechsCatalogPage';

const basename = process.env.NODE_ENV === 'production' ? '/mechs-assistant' : undefined;

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
          ],
        },
      ],
    },
  ],
  { basename }
);
