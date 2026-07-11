import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import App from './App';
import { theme } from './theme';

describe('App', () => {
  it('рендерит каталог мехов и подгружает данные из JSON', async () => {
    render(
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    );

    expect(screen.getByRole('heading', { name: 'Каталог мехов' })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Всего мехов:/)).toBeInTheDocument();
    });
  });
});
