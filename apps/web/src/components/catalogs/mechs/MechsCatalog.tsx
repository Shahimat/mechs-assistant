import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, CircularProgress, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useRobotsStore } from '@/stores/robots/store';
import type { Robot } from '@/types/robot';
import { CatalogHeader } from '@/components/catalog/CatalogHeader';
import { CatalogSection } from '@/components/catalog/CatalogSection';
import { CatalogGrid } from '@/components/catalog/CatalogGrid';
import { FavoritesDnDSection } from '@/components/catalog/FavoritesDnDSection';
import { FilterPanel } from '@/components/catalog/FilterPanel';
import { SearchField } from '@/components/catalog/SearchField';
import { Page, CenteredPage } from '@/components/catalog/CatalogPage.styles';
import { FilterGroup, FilterLabel } from '@/components/catalog/FilterPanel.styles';
import { SectionDivider } from '@/components/catalog/CatalogSection.styles';
import { useSearchFilter } from '@/components/catalog/hooks/useSearchFilter';
import { useLevelRangeFilter } from '@/components/catalog/hooks/useLevelRangeFilter';
import { useTypeFilter } from '@/components/catalog/hooks/useTypeFilter';
import { useDeepLinkOpen } from '@/components/catalog/hooks/useDeepLinkOpen';
import { LevelRangeFilter } from '@/components/catalog/LevelRangeFilter';
import { RobotCard } from './RobotCard';
import { RobotDetail } from './RobotDetail';
import { SortableRobotCard } from './SortableRobotCard';

type MechType = 'боец' | 'транспортник' | 'добытчик' | 'разведчик';

const TYPE_OPTIONS: Array<{ value: MechType; label: string }> = [
  { value: 'боец', label: 'Боец' },
  { value: 'транспортник', label: 'Транспорт' },
  { value: 'добытчик', label: 'Добытчик' },
  { value: 'разведчик', label: 'Разведчик' },
];

const getRobotName = (r: Robot) => r.name;
const getRobotLevel = (r: Robot) => r.requiredLevel;

export function MechsCatalog() {
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
  const { openInUrl, clearOpen } = useDeepLinkOpen(
    robots,
    (r) => r.key,
    setSelectedRobot,
    () => setSelectedRobot(null)
  );

  useEffect(() => {
    if (robots.length === 0 && !isLoading) {
      initializeRobots();
    }
  }, [robots.length, isLoading, initializeRobots]);

  const typeFilter = useTypeFilter<MechType>();
  const level = useLevelRangeFilter({ items: robots, getLevel: getRobotLevel });
  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  const commonlyFiltered = useMemo(() => {
    return robots.filter((r) => typeFilter.matches(r.type as MechType) && level.matches(r));
  }, [robots, typeFilter, level]);

  const { favoriteRobots, otherRobots } = useMemo(() => {
    const byKey = new Map(commonlyFiltered.map((r) => [r.key, r]));
    const favs: Robot[] = [];
    for (const key of favorites) {
      const robot = byKey.get(key);
      if (robot) favs.push(robot);
    }
    const others: Robot[] = [];
    for (const r of byKey.values()) {
      if (!favoritesSet.has(r.key)) others.push(r);
    }
    return { favoriteRobots: favs, otherRobots: others };
  }, [commonlyFiltered, favorites, favoritesSet]);

  const favSearch = useSearchFilter(favoriteRobots, getRobotName);
  const otherSearch = useSearchFilter(otherRobots, getRobotName);

  const filteredCount = favSearch.filtered.length + otherSearch.filtered.length;
  const filtersActive =
    typeFilter.isActive || level.isActive || favSearch.isActive || otherSearch.isActive;

  const resetFilters = useCallback(() => {
    typeFilter.reset();
    level.reset();
    favSearch.reset();
    otherSearch.reset();
  }, [typeFilter, level, favSearch, otherSearch]);

  const handleToggleFavorite = useCallback((key: string) => toggleFavorite(key), [toggleFavorite]);
  const handleCardClick = useCallback(
    (robot: Robot) => {
      setSelectedRobot(robot);
      openInUrl(robot.key);
    },
    [openInUrl]
  );

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
      <CatalogHeader
        title="Каталог мехов"
        summary={
          <>
            Показано: {filteredCount} из {robots.length}
            {favoriteRobots.length > 0 && ` · в избранном: ${favoriteRobots.length}`}
          </>
        }
      />

      <FilterPanel filtersActive={filtersActive} onReset={resetFilters}>
        <FilterGroup>
          <FilterLabel>Тип:</FilterLabel>
          <ToggleButtonGroup
            value={typeFilter.selected}
            onChange={(_, next: MechType[]) => typeFilter.setSelected(next)}
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
          min={level.min}
          max={level.max}
          applied={level.applied}
          onCommit={level.commit}
        />
      </FilterPanel>

      {favoriteRobots.length > 0 && (
        <>
          <CatalogSection
            title="Избранные"
            search={
              <SearchField
                value={favSearch.query}
                onChange={favSearch.setQuery}
                placeholder="Поиск по избранным"
              />
            }
          >
            <FavoritesDnDSection
              items={favSearch.filtered}
              getKey={(r) => r.key}
              onReorder={reorderFavorites}
              renderCard={(robot) => (
                <SortableRobotCard
                  key={robot.key}
                  robot={robot}
                  onToggleFavorite={handleToggleFavorite}
                  onClick={handleCardClick}
                />
              )}
            />
          </CatalogSection>
          <SectionDivider />
        </>
      )}

      <CatalogSection
        title={favoriteRobots.length > 0 ? 'Все мехи' : 'Мехи'}
        search={
          <SearchField
            value={otherSearch.query}
            onChange={otherSearch.setQuery}
            placeholder={favoriteRobots.length > 0 ? 'Поиск по остальным' : 'Поиск по названию'}
          />
        }
      >
        {otherSearch.filtered.length === 0 ? (
          <Alert severity="info">
            {filtersActive ? 'Ничего не найдено по фильтрам' : 'Нет мехов для отображения'}
          </Alert>
        ) : (
          <CatalogGrid>
            {otherSearch.filtered.map((robot) => (
              <RobotCard
                key={robot.key}
                robot={robot}
                isFavorite={false}
                onToggleFavorite={handleToggleFavorite}
                onClick={handleCardClick}
              />
            ))}
          </CatalogGrid>
        )}
      </CatalogSection>

      <RobotDetail
        robot={selectedRobot}
        onClose={() => {
          setSelectedRobot(null);
          clearOpen();
        }}
      />
    </Page>
  );
}
