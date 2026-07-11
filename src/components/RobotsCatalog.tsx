import { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Divider,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { useRobotsStore } from '../stores/robots/store';
import { RobotCard } from './RobotCard';
import { RobotDetail } from './RobotDetail';
import { SortableRobotCard } from './SortableRobotCard';
import type { Robot } from '../types/robot';

const GRID_SX = {
  display: 'grid',
  gridTemplateColumns: {
    xs: '1fr',
    sm: 'repeat(2, 1fr)',
    md: 'repeat(3, 1fr)',
    lg: 'repeat(4, 1fr)',
  },
  gap: 2,
} as const;

export function RobotsCatalog() {
  const {
    robots,
    favorites,
    isLoading,
    error,
    initializeRobots,
    toggleFavorite,
    reorderFavorites,
  } = useRobotsStore();
  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);
  const [query, setQuery] = useState('');

  // activationConstraint.distance: drag стартует только после смещения
  // на 8px — обычный клик по карточке или звёздочке не запускает drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = favorites.indexOf(String(active.id));
    const newIndex = favorites.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    reorderFavorites(arrayMove(favorites, oldIndex, newIndex));
  };

  useEffect(() => {
    if (robots.length === 0 && !isLoading) {
      initializeRobots();
    }
  }, [robots.length, isLoading, initializeRobots]);

  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  const { favoriteRobots, otherRobots } = useMemo(() => {
    const byKey = new Map(robots.map((r) => [r.key, r]));
    // favoriteRobots: в порядке массива favorites (сохраняем D&D-порядок),
    // пропускаем ключи, которых нет в текущем каталоге (защита от
    // рассинхронизации между IndexedDB и загруженным JSON).
    const favs: Robot[] = [];
    for (const key of favorites) {
      const robot = byKey.get(key);
      if (robot) favs.push(robot);
    }
    const others: Robot[] = robots.filter((r) => !favoritesSet.has(r.key));
    return { favoriteRobots: favs, otherRobots: others };
  }, [robots, favorites, favoritesSet]);

  const filteredOthers = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return otherRobots;
    return otherRobots.filter((r) => r.name.toLowerCase().includes(trimmed));
  }, [otherRobots, query]);

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
        {favoriteRobots.length > 0 && ` · в избранном: ${favoriteRobots.length}`}
      </Typography>

      {favoriteRobots.length > 0 && (
        <>
          <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
            Избранные
          </Typography>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={favoriteRobots.map((r) => r.key)}
              strategy={rectSortingStrategy}
            >
              <Box sx={{ ...GRID_SX, mb: 4 }}>
                {favoriteRobots.map((robot) => (
                  <SortableRobotCard
                    key={robot.key}
                    robot={robot}
                    onToggleFavorite={toggleFavorite}
                    onClick={setSelectedRobot}
                  />
                ))}
              </Box>
            </SortableContext>
          </DndContext>
          <Divider sx={{ mb: 4 }} />
        </>
      )}

      <Box
        sx={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          mb: 2,
        }}
      >
        <Typography variant="h6" component="h2">
          {favoriteRobots.length > 0 ? 'Все мехи' : 'Мехи'}
        </Typography>
        <TextField
          size="small"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по названию"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: { xs: '100%', sm: 280 } }}
        />
      </Box>

      {filteredOthers.length === 0 ? (
        <Alert severity="info">
          {query.trim()
            ? `По запросу «${query.trim()}» ничего не найдено`
            : 'Нет мехов для отображения'}
        </Alert>
      ) : (
        <Box sx={GRID_SX}>
          {filteredOthers.map((robot) => (
            <RobotCard
              key={robot.key}
              robot={robot}
              isFavorite={false}
              onToggleFavorite={toggleFavorite}
              onClick={setSelectedRobot}
            />
          ))}
        </Box>
      )}

      <RobotDetail robot={selectedRobot} onClose={() => setSelectedRobot(null)} />
    </Container>
  );
}
