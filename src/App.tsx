import { Box, Container, Typography, Paper } from '@mui/material';

const App: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 2,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            textAlign: 'center',
            maxWidth: 600,
            width: '100%',
          }}
        >
          <Typography variant="h2" component="h1" gutterBottom color="primary">
            Мехи.Земля
          </Typography>
          <Typography variant="h5" component="h2" color="text.secondary" gutterBottom>
            WEB ассистент игры
          </Typography>
          <Box sx={{ mt: 4, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
            <Typography variant="body1" component="p">
              ✅ Приложение успешно запущено!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              React + MUI + TypeScript работают корректно
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default App;
