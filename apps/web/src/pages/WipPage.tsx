import { Alert, Container, Typography } from '@mui/material';

interface WipPageProps {
  title: string;
  epic?: string;
}

/**
 * Заглушка «в разработке» для маршрутов, чьи фичи ещё не реализованы —
 * плитки на HomePage сразу навигируют, но контент подтягивается позже
 * (MVP2 Калькулятор прокачки, MVP3 Клановый склад, MVP4 Боевой
 * калькулятор). См. context/roadmap.md.
 */
export function WipPage({ title, epic }: WipPageProps) {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {title}
      </Typography>
      <Alert severity="info" sx={{ mt: 2 }}>
        Раздел в разработке. {epic ? `Появится в рамках ${epic}.` : 'Появится позднее.'}
      </Alert>
    </Container>
  );
}
