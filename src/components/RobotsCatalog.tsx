import { useEffect, useState } from 'react';
import { Container, Box, Typography, Alert, CircularProgress } from '@mui/material';
import { useRobotsStore } from '../stores/robots/store';
import { RobotCard } from './RobotCard';
import { RobotDetail } from './RobotDetail';
import type { Robot } from '../types/robot';

export function RobotsCatalog() {
  const { robots, favorites, isLoading, error, initializeRobots, toggleFavorite } =
    useRobotsStore();
  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);

  useEffect(() => {
    if (robots.length === 0 && !isLoading) {
      initializeRobots();
    }
  }, [robots.length, isLoading, initializeRobots]);

  const favoritesSet = new Set(favorites);

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (robots.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">Нет данных для отображения</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Каталог мехов
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Всего мехов: {robots.length}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: 2,
        }}
      >
        {robots.map((robot) => (
          <RobotCard
            key={robot.key}
            robot={robot}
            isFavorite={favoritesSet.has(robot.key)}
            onToggleFavorite={toggleFavorite}
            onClick={setSelectedRobot}
          />
        ))}
      </Box>
      <RobotDetail robot={selectedRobot} onClose={() => setSelectedRobot(null)} />
    </Container>
  );
}
