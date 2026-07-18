import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, CircularProgress } from '@mui/material';
import { useLootStore } from '@/stores/loot/store';
import type { Loot } from '@/types/loot';
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
import { useDeepLinkOpen } from '@/components/catalog/hooks/useDeepLinkOpen';
import { LootCard } from './LootCard';
import { LootDetail } from './LootDetail';
import { SortableLootCard } from './SortableLootCard';
import { PAIRS_WITH_LABELS, LABEL_TO_SOURCE } from './sourceLabels';

const getLootName = (l: Loot) => l.name;

export function LootCatalog() {
  const { loot, favorites, isLoading, error, initializeLoot, toggleFavorite, reorderFavorites } =
    useLootStore();
  const [selectedLoot, setSelectedLoot] = useState<Loot | null>(null);
  const { openInUrl, clearOpen } = useDeepLinkOpen(
    loot,
    (l) => l.key,
    setSelectedLoot,
    () => setSelectedLoot(null)
  );

  useEffect(() => {
    if (loot.length === 0 && !isLoading) {
      initializeLoot();
    }
  }, [loot.length, isLoading, initializeLoot]);

  const sourceFilter = usePairFilter<string>(PAIRS_WITH_LABELS);
  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  // Матч через `some()` — готов к будущим пересечениям (сейчас всегда
  // одноэлементный, но семантика верная и для многоэлементных sources).
  const activeSources = useMemo(
    () => new Set(sourceFilter.activeValues.map((label) => LABEL_TO_SOURCE[label] ?? label)),
    [sourceFilter.activeValues]
  );

  const commonlyFiltered = useMemo(() => {
    if (!sourceFilter.isActive) return loot;
    return loot.filter((l) => l.sources.some((s) => activeSources.has(s)));
  }, [loot, sourceFilter.isActive, activeSources]);

  const { favoriteLoot, otherLoot } = useMemo(() => {
    const byKey = new Map(commonlyFiltered.map((l) => [l.key, l]));
    const favs: Loot[] = [];
    for (const key of favorites) {
      const l = byKey.get(key);
      if (l) favs.push(l);
    }
    const others: Loot[] = [];
    for (const l of byKey.values()) {
      if (!favoritesSet.has(l.key)) others.push(l);
    }
    return { favoriteLoot: favs, otherLoot: others };
  }, [commonlyFiltered, favorites, favoritesSet]);

  const favSearch = useSearchFilter(favoriteLoot, getLootName);
  const otherSearch = useSearchFilter(otherLoot, getLootName);

  const filteredCount = favSearch.filtered.length + otherSearch.filtered.length;
  const filtersActive = sourceFilter.isActive || favSearch.isActive || otherSearch.isActive;

  const resetFilters = useCallback(() => {
    sourceFilter.reset();
    favSearch.reset();
    otherSearch.reset();
  }, [sourceFilter, favSearch, otherSearch]);

  const handleToggleFavorite = useCallback((key: string) => toggleFavorite(key), [toggleFavorite]);
  const handleCardClick = useCallback(
    (l: Loot) => {
      setSelectedLoot(l);
      openInUrl(l.key);
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

  if (loot.length === 0) {
    return (
      <Page maxWidth="lg">
        <Alert severity="info">Нет данных для отображения</Alert>
      </Page>
    );
  }

  return (
    <Page maxWidth="lg">
      <CatalogHeader
        title="Каталог лута"
        summary={
          <>
            Показано: {filteredCount} из {loot.length}
            {favoriteLoot.length > 0 && ` · в избранном: ${favoriteLoot.length}`}
          </>
        }
      />

      <FilterPanel filtersActive={filtersActive} onReset={resetFilters}>
        <FilterGroup>
          <FilterLabel>Источник</FilterLabel>
          <PairToggleGroup
            pairs={PAIRS_WITH_LABELS}
            state={sourceFilter.state}
            onToggleValue={sourceFilter.toggleValue}
          />
        </FilterGroup>
      </FilterPanel>

      {favoriteLoot.length > 0 && (
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
              getKey={(l) => l.key}
              onReorder={reorderFavorites}
              renderCard={(l) => (
                <SortableLootCard
                  key={l.key}
                  loot={l}
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
        title={favoriteLoot.length > 0 ? 'Весь лут' : 'Лут'}
        search={
          <SearchField
            value={otherSearch.query}
            onChange={otherSearch.setQuery}
            placeholder={favoriteLoot.length > 0 ? 'Поиск по остальным' : 'Поиск по названию'}
          />
        }
      >
        {otherSearch.filtered.length === 0 ? (
          <Alert severity="info">
            {filtersActive ? 'Ничего не найдено по фильтрам' : 'Ничего не найдено'}
          </Alert>
        ) : (
          <CatalogGrid>
            {otherSearch.filtered.map((l) => (
              <LootCard
                key={l.key}
                loot={l}
                isFavorite={false}
                onToggleFavorite={handleToggleFavorite}
                onClick={handleCardClick}
              />
            ))}
          </CatalogGrid>
        )}
      </CatalogSection>

      <LootDetail
        loot={selectedLoot}
        onClose={() => {
          setSelectedLoot(null);
          clearOpen();
        }}
      />
    </Page>
  );
}
