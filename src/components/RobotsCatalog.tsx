import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Typography,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Button,
} from '@mui/material';
import { Search, FilterAltOff } from '@mui/icons-material';
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
import { LevelRangeFilter } from './LevelRangeFilter';
import type { Robot } from '../types/robot';
import {
  Page,
  CenteredPage,
  Summary,
  SectionTitle,
  Grid,
  FavoritesGrid,
  SectionDivider,
  FiltersPanel,
  FilterGroup,
  FilterLabel,
  ResetButtonSlot,
  SectionHeader,
  SectionSearch,
} from './RobotsCatalog.styles';

type MechType = 'боец' | 'транспортник' | 'добытчик' | 'разведчик';

const TYPE_OPTIONS: Array<{ value: MechType; label: string }> = [
  { value: 'боец', label: 'Боец' },
  { value: 'транспортник', label: 'Транспорт' },
  { value: 'добытчик', label: 'Добытчик' },
  { value: 'разведчик', label: 'Разведчик' },
];

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
  const [favQuery, setFavQuery] = useState('');
  const [otherQuery, setOtherQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<MechType[]>([]);
  const [levelRange, setLevelRange] = useState<[number, number] | null>(null);

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

  const { minLevel, maxLevel } = useMemo(() => {
    if (robots.length === 0) return { minLevel: 1, maxLevel: 100 };
    const levels = robots
      .map((r) => r.requiredLevel)
      .filter((l): l is number => typeof l === 'number');
    if (levels.length === 0) return { minLevel: 1, maxLevel: 100 };
    return { minLevel: Math.min(...levels), maxLevel: Math.max(...levels) };
  }, [robots]);

  useEffect(() => {
    if (robots.length > 0 && levelRange === null) {
      setLevelRange([minLevel, maxLevel]);
    }
  }, [robots.length, minLevel, maxLevel, levelRange]);

  const activeLevelRange = useMemo<[number, number]>(
    () => levelRange ?? [minLevel, maxLevel],
    [levelRange, minLevel, maxLevel]
  );
  const filtersActive =
    favQuery.trim().length > 0 ||
    otherQuery.trim().length > 0 ||
    selectedTypes.length > 0 ||
    activeLevelRange[0] !== minLevel ||
    activeLevelRange[1] !== maxLevel;

  const resetFilters = () => {
    setFavQuery('');
    setOtherQuery('');
    setSelectedTypes([]);
    setLevelRange([minLevel, maxLevel]);
  };

  const handleLevelCommit = useCallback((val: [number, number]) => {
    setLevelRange(val);
  }, []);

  const handleToggleFavorite = useCallback(
    (key: string) => toggleFavorite(key),
    [toggleFavorite]
  );

  const handleCardClick = useCallback((robot: Robot) => setSelectedRobot(robot), []);

  const matchesCommonFilters = useMemo(() => {
    const [lo, hi] = activeLevelRange;
    const levelActive = lo > minLevel || hi < maxLevel;
    return (r: Robot) => {
      if (selectedTypes.length > 0 && !selectedTypes.includes(r.type as MechType)) {
        return false;
      }
      if (levelActive) {
        const lvl = r.requiredLevel;
        if (lvl != null && (lvl < lo || lvl > hi)) return false;
      }
      return true;
    };
  }, [selectedTypes, activeLevelRange, minLevel, maxLevel]);

  const { favoriteRobots, otherRobots, filteredCount } = useMemo(() => {
    const filteredByKey = new Map(
      robots.filter(matchesCommonFilters).map((r) => [r.key, r])
    );
    const favs: Robot[] = [];
    for (const key of favorites) {
      const robot = filteredByKey.get(key);
      if (robot) favs.push(robot);
    }
    const others: Robot[] = [];
    for (const r of filteredByKey.values()) {
      if (!favoritesSet.has(r.key)) others.push(r);
    }
    const favTrimmed = favQuery.trim().toLowerCase();
    const otherTrimmed = otherQuery.trim().toLowerCase();
    const favsFiltered = favTrimmed
      ? favs.filter((r) => r.name.toLowerCase().includes(favTrimmed))
      : favs;
    const othersFiltered = otherTrimmed
      ? others.filter((r) => r.name.toLowerCase().includes(otherTrimmed))
      : others;
    return {
      favoriteRobots: favsFiltered,
      otherRobots: othersFiltered,
      filteredCount: favsFiltered.length + othersFiltered.length,
    };
  }, [robots, favorites, favoritesSet, matchesCommonFilters, favQuery, otherQuery]);

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
        Показано: {filteredCount} из {robots.length}
        {favoriteRobots.length > 0 && ` · в избранном: ${favoriteRobots.length}`}
      </Summary>

      <FiltersPanel>
        <FilterGroup>
          <FilterLabel>Тип:</FilterLabel>
          <ToggleButtonGroup
            value={selectedTypes}
            onChange={(_, next: MechType[]) => setSelectedTypes(next)}
            size="small"
            aria-label="Тип меха"
          >
            {TYPE_OPTIONS.map(({ value, label }) => (
              <ToggleButton key={value} value={value}>
                {label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </FilterGroup>

        <LevelRangeFilter
          min={minLevel}
          max={maxLevel}
          applied={activeLevelRange}
          onCommit={handleLevelCommit}
        />

        <ResetButtonSlot active={filtersActive}>
          <Button
            size="small"
            variant="text"
            startIcon={<FilterAltOff />}
            onClick={resetFilters}
          >
            Сбросить
          </Button>
        </ResetButtonSlot>
      </FiltersPanel>

      {favoriteRobots.length > 0 && (
        <>
          <SectionHeader>
            <SectionTitle>Избранные</SectionTitle>
            <SectionSearch>
              <TextField
                size="small"
                fullWidth
                value={favQuery}
                onChange={(e) => setFavQuery(e.target.value)}
                placeholder="Поиск по избранным"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </SectionSearch>
          </SectionHeader>
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
                    onToggleFavorite={handleToggleFavorite}
                    onClick={handleCardClick}
                  />
                ))}
              </FavoritesGrid>
            </SortableContext>
          </DndContext>
          <SectionDivider />
        </>
      )}

      <SectionHeader>
        <SectionTitle>{favoriteRobots.length > 0 ? 'Все мехи' : 'Мехи'}</SectionTitle>
        <SectionSearch>
          <TextField
            size="small"
            fullWidth
            value={otherQuery}
            onChange={(e) => setOtherQuery(e.target.value)}
            placeholder={favoriteRobots.length > 0 ? 'Поиск по остальным' : 'Поиск по названию'}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </SectionSearch>
      </SectionHeader>
      {otherRobots.length === 0 ? (
        <Alert severity="info">
          {filtersActive
            ? 'Ничего не найдено по фильтрам'
            : 'Нет мехов для отображения'}
        </Alert>
      ) : (
        <Grid>
          {otherRobots.map((robot) => (
            <RobotCard
              key={robot.key}
              robot={robot}
              isFavorite={false}
              onToggleFavorite={handleToggleFavorite}
              onClick={handleCardClick}
            />
          ))}
        </Grid>
      )}

      <RobotDetail robot={selectedRobot} onClose={() => setSelectedRobot(null)} />
    </Page>
  );
}
