import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, CircularProgress } from '@mui/material';
import { useAmmoStore } from '@/stores/ammo/store';
import type { Ammo } from '@/types/ammo';
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
import { AmmoCard } from './AmmoCard';
import { AmmoDetail } from './AmmoDetail';
import { SortableAmmoCard } from './SortableAmmoCard';
import { PAIRS_WITH_LABELS, LABEL_TO_CATEGORY } from './categoryLabels';

const getItemName = (a: Ammo) => a.name;

export function AmmoCatalog() {
  const { ammo, favorites, isLoading, error, initializeAmmo, toggleFavorite, reorderFavorites } =
    useAmmoStore();
  const [selectedItem, setSelectedItem] = useState<Ammo | null>(null);

  useEffect(() => {
    if (ammo.length === 0 && !isLoading) {
      initializeAmmo();
    }
  }, [ammo.length, isLoading, initializeAmmo]);

  const familyFilter = usePairFilter<string>(PAIRS_WITH_LABELS);
  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  // Активные CSS-slug'и — трансформируем русские labels обратно в slug.
  // Ammo попадает в результат, если его `family` (одиночный slug) точно в
  // множестве активных. `compatibleCategories` сюда не участвует — это
  // справочное поле, а фильтрация по пересечению тянула ложные совпадения
  // (пулемётный патрон с compat=['bullet','missile'] попадал в фильтр
  // «Пушка» вместе с пушечными).
  const activeCategories = useMemo(
    () => new Set(familyFilter.activeValues.map((label) => LABEL_TO_CATEGORY[label] ?? label)),
    [familyFilter.activeValues]
  );

  const commonlyFiltered = useMemo(() => {
    if (!familyFilter.isActive) return ammo;
    return ammo.filter((a) => activeCategories.has(a.family));
  }, [ammo, familyFilter.isActive, activeCategories]);

  const { favoriteItems, otherItems } = useMemo(() => {
    const byKey = new Map(commonlyFiltered.map((a) => [a.key, a]));
    const favs: Ammo[] = [];
    for (const key of favorites) {
      const a = byKey.get(key);
      if (a) favs.push(a);
    }
    const others: Ammo[] = [];
    for (const a of byKey.values()) {
      if (!favoritesSet.has(a.key)) others.push(a);
    }
    return { favoriteItems: favs, otherItems: others };
  }, [commonlyFiltered, favorites, favoritesSet]);

  const favSearch = useSearchFilter(favoriteItems, getItemName);
  const otherSearch = useSearchFilter(otherItems, getItemName);

  const filteredCount = favSearch.filtered.length + otherSearch.filtered.length;
  const filtersActive = familyFilter.isActive || favSearch.isActive || otherSearch.isActive;

  const resetFilters = useCallback(() => {
    familyFilter.reset();
    favSearch.reset();
    otherSearch.reset();
  }, [familyFilter, favSearch, otherSearch]);

  const handleToggleFavorite = useCallback((key: string) => toggleFavorite(key), [toggleFavorite]);
  const handleCardClick = useCallback((item: Ammo) => setSelectedItem(item), []);

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

  if (ammo.length === 0) {
    return (
      <Page maxWidth="lg">
        <Alert severity="info">Нет данных для отображения</Alert>
      </Page>
    );
  }

  return (
    <Page maxWidth="lg">
      <CatalogHeader
        title="Каталог боезапасов"
        summary={
          <>
            Показано: {filteredCount} из {ammo.length}
            {favoriteItems.length > 0 && ` · в избранном: ${favoriteItems.length}`}
          </>
        }
      />

      <FilterPanel filtersActive={filtersActive} onReset={resetFilters}>
        <FilterGroup>
          <FilterLabel>Тип</FilterLabel>
          <PairToggleGroup
            pairs={PAIRS_WITH_LABELS}
            state={familyFilter.state}
            onToggleValue={familyFilter.toggleValue}
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
              getKey={(a) => a.key}
              onReorder={reorderFavorites}
              renderCard={(item) => (
                <SortableAmmoCard
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
        title={favoriteItems.length > 0 ? 'Весь боезапас' : 'Боезапас'}
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
              <AmmoCard
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

      <AmmoDetail item={selectedItem} onClose={() => setSelectedItem(null)} />
    </Page>
  );
}
