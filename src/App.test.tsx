import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import App from './App';
import { theme } from './theme';

describe('App', () => {
  it('должен отображать заголовок приложения', () => {
    render(
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    );

    expect(screen.getByText('Мехи.Земля')).toBeInTheDocument();
    expect(screen.getByText('WEB ассистент игры')).toBeInTheDocument();
    expect(screen.getByText(/Приложение успешно запущено/)).toBeInTheDocument();
  });
});
