import { render, screen, waitFor } from '@testing-library/react';
import { Experimental_CssVarsProvider as CssVarsProvider } from '@mui/material/styles';
import App from './App';
import { theme } from './theme';

describe('App', () => {
  it('рендерит каталог мехов и подгружает данные из JSON', async () => {
    render(
      <CssVarsProvider theme={theme} defaultMode="dark">
        <App />
      </CssVarsProvider>
    );

    expect(screen.getByRole('heading', { name: 'Каталог мехов' })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Показано:/)).toBeInTheDocument();
    });
  });
});
