import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, CircularProgress } from '@mui/material';
import { useItemsStore } from '@/stores/items/store';
import type { Item } from '@/types/item';
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
import { ItemCard } from './ItemCard';
import { ItemDetail } from './ItemDetail';
import { SortableItemCard } from './SortableItemCard';
import { PAIRS_WITH_LABELS, LABEL_TO_SUBTYPE } from './subtypeLabels';

const getItemName = (i: Item) => i.name;

export function ItemsCatalog() {
  const { items, favorites, isLoading, error, initializeItems, toggleFavorite, reorderFavorites } =
    useItemsStore();
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const { openInUrl, clearOpen } = useDeepLinkOpen(
    items,
    (i) => i.key,
    setSelectedItem,
    () => setSelectedItem(null)
  );

  useEffect(() => {
    if (items.length === 0 && !isLoading) {
      initializeItems();
    }
  }, [items.length, isLoading, initializeItems]);

  const subtypeFilter = usePairFilter<string>(PAIRS_WITH_LABELS);
  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  // Активные subtype'ы — трансформируем русские labels обратно в slug.
  // Матч — item.subtype в множестве активных (одиночный slug).
  const activeSubtypes = useMemo(
    () => new Set(subtypeFilter.activeValues.map((label) => LABEL_TO_SUBTYPE[label] ?? label)),
    [subtypeFilter.activeValues]
  );

  const commonlyFiltered = useMemo(() => {
    if (!subtypeFilter.isActive) return items;
    return items.filter((i) => activeSubtypes.has(i.subtype));
  }, [items, subtypeFilter.isActive, activeSubtypes]);

  const { favoriteItems, otherItems } = useMemo(() => {
    const byKey = new Map(commonlyFiltered.map((i) => [i.key, i]));
    const favs: Item[] = [];
    for (const key of favorites) {
      const i = byKey.get(key);
      if (i) favs.push(i);
    }
    const others: Item[] = [];
    for (const i of byKey.values()) {
      if (!favoritesSet.has(i.key)) others.push(i);
    }
    return { favoriteItems: favs, otherItems: others };
  }, [commonlyFiltered, favorites, favoritesSet]);

  const favSearch = useSearchFilter(favoriteItems, getItemName);
  const otherSearch = useSearchFilter(otherItems, getItemName);

  const filteredCount = favSearch.filtered.length + otherSearch.filtered.length;
  const filtersActive = subtypeFilter.isActive || favSearch.isActive || otherSearch.isActive;

  const resetFilters = useCallback(() => {
    subtypeFilter.reset();
    favSearch.reset();
    otherSearch.reset();
  }, [subtypeFilter, favSearch, otherSearch]);

  const handleToggleFavorite = useCallback((key: string) => toggleFavorite(key), [toggleFavorite]);
  const handleCardClick = useCallback(
    (item: Item) => {
      setSelectedItem(item);
      openInUrl(item.key);
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

  if (items.length === 0) {
    return (
      <Page maxWidth="lg">
        <Alert severity="info">Нет данных для отображения</Alert>
      </Page>
    );
  }

  return (
    <Page maxWidth="lg">
      <CatalogHeader
        title="Каталог предметов"
        summary={
          <>
            Показано: {filteredCount} из {items.length}
            {favoriteItems.length > 0 && ` · в избранном: ${favoriteItems.length}`}
          </>
        }
      />

      <FilterPanel filtersActive={filtersActive} onReset={resetFilters}>
        <FilterGroup>
          <FilterLabel>Тип</FilterLabel>
          <PairToggleGroup
            pairs={PAIRS_WITH_LABELS}
            state={subtypeFilter.state}
            onToggleValue={subtypeFilter.toggleValue}
          />
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
              getKey={(i) => i.key}
              onReorder={reorderFavorites}
              renderCard={(item) => (
                <SortableItemCard
                  key={item.key}
                  item={item}
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
        title={favoriteItems.length > 0 ? 'Все предметы' : 'Предметы'}
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
            {otherSearch.filtered.map((item) => (
              <ItemCard
                key={item.key}
                item={item}
                isFavorite={false}
                onToggleFavorite={handleToggleFavorite}
                onClick={handleCardClick}
              />
            ))}
          </CatalogGrid>
        )}
      </CatalogSection>

      <ItemDetail
        item={selectedItem}
        onClose={() => {
          setSelectedItem(null);
          clearOpen();
        }}
      />
    </Page>
  );
}
