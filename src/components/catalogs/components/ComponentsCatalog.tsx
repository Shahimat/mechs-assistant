import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, CircularProgress } from '@mui/material';
import { useComponentsStore } from '@/stores/components/store';
import type { Component } from '@/types/component';
import { CatalogHeader } from '@/components/catalog/CatalogHeader';
import { CatalogSection } from '@/components/catalog/CatalogSection';
import { CatalogGrid } from '@/components/catalog/CatalogGrid';
import { FavoritesDnDSection } from '@/components/catalog/FavoritesDnDSection';
import { FilterPanel } from '@/components/catalog/FilterPanel';
import { SearchField } from '@/components/catalog/SearchField';
import { Page, CenteredPage } from '@/components/catalog/CatalogPage.styles';
import { FilterGroup, FilterLabel } from '@/components/catalog/FilterPanel.styles';
import { SectionDivider } from '@/components/catalog/CatalogSection.styles';
import { PairToggleGroup } from '@/components/catalog/PairToggleGroup';
import { useSearchFilter } from '@/components/catalog/hooks/useSearchFilter';
import { usePairFilter } from '@/components/catalog/hooks/usePairFilter';
import { ComponentCard } from './ComponentCard';
import { ComponentDetail } from './ComponentDetail';
import { SortableComponentCard } from './SortableComponentCard';
import { PAIRS_WITH_LABELS, LABEL_TO_KIND } from './kindLabels';

const getComponentName = (c: Component) => c.name;

export function ComponentsCatalog() {
  const {
    components,
    favorites,
    isLoading,
    error,
    initializeComponents,
    toggleFavorite,
    reorderFavorites,
  } = useComponentsStore();
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);

  useEffect(() => {
    if (components.length === 0 && !isLoading) {
      initializeComponents();
    }
  }, [components.length, isLoading, initializeComponents]);

  // Auto-hide фильтра по kind: панель появляется, только если overlay
  // заполнил `kind` у хотя бы одной записи. Иначе капсулы бесполезны
  // (нечего фильтровать) и лишь шумят в UI.
  const hasKind = useMemo(() => components.some((c) => c.kind != null), [components]);

  const kindFilter = usePairFilter<string>(PAIRS_WITH_LABELS);
  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  const activeKinds = useMemo(
    () => new Set(kindFilter.activeValues.map((label) => LABEL_TO_KIND[label] ?? label)),
    [kindFilter.activeValues]
  );

  const commonlyFiltered = useMemo(() => {
    if (!kindFilter.isActive) return components;
    return components.filter((c) => c.kind != null && activeKinds.has(c.kind));
  }, [components, kindFilter.isActive, activeKinds]);

  const { favoriteComponents, otherComponents } = useMemo(() => {
    const byKey = new Map(commonlyFiltered.map((c) => [c.key, c]));
    const favs: Component[] = [];
    for (const key of favorites) {
      const c = byKey.get(key);
      if (c) favs.push(c);
    }
    const others: Component[] = [];
    for (const c of byKey.values()) {
      if (!favoritesSet.has(c.key)) others.push(c);
    }
    return { favoriteComponents: favs, otherComponents: others };
  }, [commonlyFiltered, favorites, favoritesSet]);

  const favSearch = useSearchFilter(favoriteComponents, getComponentName);
  const otherSearch = useSearchFilter(otherComponents, getComponentName);

  const filteredCount = favSearch.filtered.length + otherSearch.filtered.length;
  const filtersActive = kindFilter.isActive || favSearch.isActive || otherSearch.isActive;

  const resetFilters = useCallback(() => {
    kindFilter.reset();
    favSearch.reset();
    otherSearch.reset();
  }, [kindFilter, favSearch, otherSearch]);

  const handleToggleFavorite = useCallback((key: string) => toggleFavorite(key), [toggleFavorite]);
  const handleCardClick = useCallback((c: Component) => setSelectedComponent(c), []);

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

  if (components.length === 0) {
    return (
      <Page maxWidth="lg">
        <Alert severity="info">Нет данных для отображения</Alert>
      </Page>
    );
  }

  return (
    <Page maxWidth="lg">
      <CatalogHeader
        title="Каталог компонентов"
        summary={
          <>
            Показано: {filteredCount} из {components.length}
            {favoriteComponents.length > 0 && ` · в избранном: ${favoriteComponents.length}`}
          </>
        }
      />

      {hasKind && (
        <FilterPanel filtersActive={filtersActive} onReset={resetFilters}>
          <FilterGroup>
            <FilterLabel>Тип</FilterLabel>
            <PairToggleGroup
              pairs={PAIRS_WITH_LABELS}
              state={kindFilter.state}
              onToggleValue={kindFilter.toggleValue}
            />
          </FilterGroup>
        </FilterPanel>
      )}

      {favoriteComponents.length > 0 && (
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
              getKey={(c) => c.key}
              onReorder={reorderFavorites}
              renderCard={(c) => (
                <SortableComponentCard
                  key={c.key}
                  component={c}
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
        title={favoriteComponents.length > 0 ? 'Все компоненты' : 'Компоненты'}
        search={
          <SearchField
            value={otherSearch.query}
            onChange={otherSearch.setQuery}
            placeholder={favoriteComponents.length > 0 ? 'Поиск по остальным' : 'Поиск по названию'}
          />
        }
      >
        {otherSearch.filtered.length === 0 ? (
          <Alert severity="info">
            {filtersActive ? 'Ничего не найдено по фильтрам' : 'Ничего не найдено'}
          </Alert>
        ) : (
          <CatalogGrid>
            {otherSearch.filtered.map((c) => (
              <ComponentCard
                key={c.key}
                component={c}
                isFavorite={false}
                onToggleFavorite={handleToggleFavorite}
                onClick={handleCardClick}
              />
            ))}
          </CatalogGrid>
        )}
      </CatalogSection>

      <ComponentDetail component={selectedComponent} onClose={() => setSelectedComponent(null)} />
    </Page>
  );
}
