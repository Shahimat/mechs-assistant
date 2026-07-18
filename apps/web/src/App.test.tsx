import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './theme';

describe('App', () => {
  it('рендерит каталог мехов и подгружает данные из JSON', async () => {
    // Каталоги переехали под /catalogs/*, index-route теперь HomePage.
    // Ставим URL до импорта App (и через него router), чтобы
    // createBrowserRouter стартовал сразу с маршрута каталога мехов.
    window.history.replaceState(null, '', '/catalogs/mechs-catalog');
    const { default: App } = await import('./App');

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme} defaultMode="dark">
          <App />
        </ThemeProvider>
      </QueryClientProvider>
    );

    expect(await screen.findByRole('heading', { name: 'Каталог мехов' })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Показано:/)).toBeInTheDocument();
    });
  });
});
