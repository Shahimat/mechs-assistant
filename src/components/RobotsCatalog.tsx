import { useEffect, useMemo, useState } from 'react';
import {
  Typography,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
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
import {
  Page,
  CenteredPage,
  Summary,
  SectionTitle,
  Grid,
  FavoritesGrid,
  SectionDivider,
  SectionHeader,
  SectionHeaderTitle,
} from './RobotsCatalog.styles';

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
      <CenteredPage maxWidth="lg">
        <CircularProgress />
      </CenteredPage>
    );
  }

  if (error) {
    return (
      <Page maxWidth="lg">
        <Alert severity="error">{error}</Alert>
      </Page>
    );
  }

  if (robots.length === 0) {
    return (
      <Page maxWidth="lg">
        <Alert severity="info">Нет данных для отображения</Alert>
      </Page>
    );
  }

  return (
    <Page maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Каталог мехов
      </Typography>
      <Summary>
        Всего мехов: {robots.length}
        {favoriteRobots.length > 0 && ` · в избранном: ${favoriteRobots.length}`}
      </Summary>

      {favoriteRobots.length > 0 && (
        <>
          <SectionTitle>Избранные</SectionTitle>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={favoriteRobots.map((r) => r.key)}
              strategy={rectSortingStrategy}
            >
              <FavoritesGrid>
                {favoriteRobots.map((robot) => (
                  <SortableRobotCard
                    key={robot.key}
                    robot={robot}
                    onToggleFavorite={toggleFavorite}
                    onClick={setSelectedRobot}
                  />
                ))}
              </FavoritesGrid>
            </SortableContext>
          </DndContext>
          <SectionDivider />
        </>
      )}

      <SectionHeader>
        <SectionHeaderTitle>
          {favoriteRobots.length > 0 ? 'Все мехи' : 'Мехи'}
        </SectionHeaderTitle>
        <TextField
          size="small"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по названию"
          sx={{ minWidth: { xs: '100%', sm: 280 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </SectionHeader>

      {filteredOthers.length === 0 ? (
        <Alert severity="info">
          {query.trim()
            ? `По запросу «${query.trim()}» ничего не найдено`
            : 'Нет мехов для отображения'}
        </Alert>
      ) : (
        <Grid>
          {filteredOthers.map((robot) => (
            <RobotCard
              key={robot.key}
              robot={robot}
              isFavorite={false}
              onToggleFavorite={toggleFavorite}
              onClick={setSelectedRobot}
            />
          ))}
        </Grid>
      )}

      <RobotDetail robot={selectedRobot} onClose={() => setSelectedRobot(null)} />
    </Page>
  );
}
