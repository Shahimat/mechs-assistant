import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, CircularProgress, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useBlueprintsStore } from '@/stores/blueprints/store';
import type { Blueprint, BlueprintCategory } from '@/types/blueprint';
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
import { useTypeFilter } from '@/components/catalog/hooks/useTypeFilter';
import { useDeepLinkOpen } from '@/components/catalog/hooks/useDeepLinkOpen';
import { BlueprintCard } from './BlueprintCard';
import { BlueprintDetail } from './BlueprintDetail';
import { SortableBlueprintCard } from './SortableBlueprintCard';
import { CATEGORY_OPTIONS } from './categoryLabels';

const getBlueprintName = (b: Blueprint) => b.name;

export function BlueprintsCatalog() {
  const {
    blueprints,
    favorites,
    isLoading,
    error,
    initializeBlueprints,
    toggleFavorite,
    reorderFavorites,
  } = useBlueprintsStore();
  const [selected, setSelected] = useState<Blueprint | null>(null);
  const { openInUrl, clearOpen } = useDeepLinkOpen(
    blueprints,
    (b) => b.key,
    setSelected,
    () => setSelected(null)
  );

  useEffect(() => {
    if (blueprints.length === 0 && !isLoading) {
      initializeBlueprints();
    }
  }, [blueprints.length, isLoading, initializeBlueprints]);

  const categoryFilter = useTypeFilter<BlueprintCategory>();
  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  const commonlyFiltered = useMemo(() => {
    if (!categoryFilter.isActive) return blueprints;
    return blueprints.filter((b) => categoryFilter.matches(b.category));
  }, [blueprints, categoryFilter]);

  const { favoriteItems, otherItems } = useMemo(() => {
    const byKey = new Map(commonlyFiltered.map((b) => [b.key, b]));
    const favs: Blueprint[] = [];
    for (const key of favorites) {
      const b = byKey.get(key);
      if (b) favs.push(b);
    }
    const others: Blueprint[] = [];
    for (const b of byKey.values()) {
      if (!favoritesSet.has(b.key)) others.push(b);
    }
    return { favoriteItems: favs, otherItems: others };
  }, [commonlyFiltered, favorites, favoritesSet]);

  const favSearch = useSearchFilter(favoriteItems, getBlueprintName);
  const otherSearch = useSearchFilter(otherItems, getBlueprintName);

  const filteredCount = favSearch.filtered.length + otherSearch.filtered.length;
  const filtersActive = categoryFilter.isActive || favSearch.isActive || otherSearch.isActive;

  const resetFilters = useCallback(() => {
    categoryFilter.reset();
    favSearch.reset();
    otherSearch.reset();
  }, [categoryFilter, favSearch, otherSearch]);

  const handleToggleFavorite = useCallback((key: string) => toggleFavorite(key), [toggleFavorite]);
  const handleCardClick = useCallback(
    (bp: Blueprint) => {
      setSelected(bp);
      openInUrl(bp.key);
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

  if (blueprints.length === 0) {
    return (
      <Page maxWidth="lg">
        <Alert severity="info">Нет данных для отображения</Alert>
      </Page>
    );
  }

  return (
    <Page maxWidth="lg">
      <CatalogHeader
        title="Каталог чертежей"
        summary={
          <>
            Показано: {filteredCount} из {blueprints.length}
            {favoriteItems.length > 0 && ` · в избранном: ${favoriteItems.length}`}
          </>
        }
      />

      <FilterPanel filtersActive={filtersActive} onReset={resetFilters}>
        <FilterGroup>
          <FilterLabel>Категория:</FilterLabel>
          <ToggleButtonGroup
            value={categoryFilter.selected}
            onChange={(_, next: BlueprintCategory[]) => categoryFilter.setSelected(next)}
            size="small"
            aria-label="Категория чертежа"
          >
            {CATEGORY_OPTIONS.map(({ value, label }) => (
              <ToggleButton key={value} value={value}>
                {label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </FilterGroup>
      </FilterPanel>

      {favoriteItems.length > 0 && (
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
              getKey={(b) => b.key}
              onReorder={reorderFavorites}
              renderCard={(bp) => (
                <SortableBlueprintCard
                  key={bp.key}
                  blueprint={bp}
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
        title={favoriteItems.length > 0 ? 'Все чертежи' : 'Чертежи'}
        search={
          <SearchField
            value={otherSearch.query}
            onChange={otherSearch.setQuery}
            placeholder={favoriteItems.length > 0 ? 'Поиск по остальным' : 'Поиск по названию'}
          />
        }
      >
        {otherSearch.filtered.length === 0 ? (
          <Alert severity="info">
            {filtersActive ? 'Ничего не найдено по фильтрам' : 'Ничего не найдено'}
          </Alert>
        ) : (
          <CatalogGrid>
            {otherSearch.filtered.map((bp) => (
              <BlueprintCard
                key={bp.key}
                blueprint={bp}
                isFavorite={false}
                onToggleFavorite={handleToggleFavorite}
                onClick={handleCardClick}
              />
            ))}
          </CatalogGrid>
        )}
      </CatalogSection>

      <BlueprintDetail
        blueprint={selected}
        onClose={() => {
          setSelected(null);
          clearOpen();
        }}
      />
    </Page>
  );
}
