import { Container, Typography, Alert } from '@mui/material';

interface CatalogStubPageProps {
  title: string;
}

export function CatalogStubPage({ title }: CatalogStubPageProps) {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {title}
      </Typography>
      <Alert severity="info">
        Каталог в разработке. Данные и view появятся, когда парсер вики и overlay из Google Sheets
        будут расширены на этот каталог (см. `context/roadmap.md`, MVP1).
      </Alert>
    </Container>
  );
}
