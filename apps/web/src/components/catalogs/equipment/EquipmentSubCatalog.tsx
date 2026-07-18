import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, CircularProgress } from '@mui/material';
import { useEquipmentStore } from '@/stores/equipment/store';
import type { Equipment, EquipmentSubtype } from '@/types/equipment';
import { CatalogHeader } from '@/components/catalog/CatalogHeader';
import { CatalogSection } from '@/components/catalog/CatalogSection';
import { CatalogGrid } from '@/components/catalog/CatalogGrid';
import { FavoritesDnDSection } from '@/components/catalog/FavoritesDnDSection';
import { FilterPanel } from '@/components/catalog/FilterPanel';
import { SearchField } from '@/components/catalog/SearchField';
import { Page, CenteredPage } from '@/components/catalog/CatalogPage.styles';
import { SectionDivider } from '@/components/catalog/CatalogSection.styles';
import { LevelRangeFilter } from '@/components/catalog/LevelRangeFilter';
import { useSearchFilter } from '@/components/catalog/hooks/useSearchFilter';
import { useLevelRangeFilter } from '@/components/catalog/hooks/useLevelRangeFilter';
import { useDeepLinkOpen } from '@/components/catalog/hooks/useDeepLinkOpen';
import { EquipmentCard } from './EquipmentCard';
import { EquipmentDetail } from './EquipmentDetail';
import { SortableEquipmentCard } from './SortableEquipmentCard';

const getItemName = (e: Equipment) => e.name;
const getItemLevel = (e: Equipment) => e.requiredLevel;

interface EquipmentSubCatalogProps {
  /** Subtype-фильтр — узкий срез единого data--equipment-catalog. */
  subtype: EquipmentSubtype;
  /** Заголовок каталога (например, «Каталог чипов»). */
  title: string;
  /** Подпись основной секции, когда есть избранные (например, «Всё оборудование» → «Все чипы»). */
  allSectionTitle: string;
  /** Подпись основной секции, когда избранных нет (например, «Чипы»). */
  soleSectionTitle: string;
}

/**
 * Общий контейнер для семи UI-каталогов оборудования. Отличаются только
 * subtype-фильтром и текстовыми подписями — data-инфраструктура и все
 * shell-примитивы (Header/Section/Grid/FilterPanel/LevelRangeFilter) общие.
 * PairToggleGroup по subtype в этой view не нужен: subtype всегда один.
 */
export function EquipmentSubCatalog({
  subtype,
  title,
  allSectionTitle,
  soleSectionTitle,
}: EquipmentSubCatalogProps) {
  const {
    equipment,
    favorites,
    isLoading,
    error,
    initializeEquipment,
    toggleFavorite,
    reorderFavorites,
  } = useEquipmentStore();
  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null);

  useEffect(() => {
    if (equipment.length === 0 && !isLoading) {
      initializeEquipment();
    }
  }, [equipment.length, isLoading, initializeEquipment]);

  // Срез по subtype считаем один раз перед всеми фильтрами — все дальнейшие
  // хуки (уровень, поиск) работают только с релевантным подмножеством.
  const subtypeItems = useMemo(
    () => equipment.filter((e) => e.subtype === subtype),
    [equipment, subtype]
  );

  // Deep-link открытие детали работает только в пределах текущего подкаталога:
  // catalogPathFor уже роутит в правильный подкаталог по subtype записи.
  const { openInUrl, clearOpen } = useDeepLinkOpen(
    subtypeItems,
    (e) => e.key,
    setSelectedItem,
    () => setSelectedItem(null)
  );

  const level = useLevelRangeFilter({ items: subtypeItems, getLevel: getItemLevel });
  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  const commonlyFiltered = useMemo(
    () => subtypeItems.filter((e) => level.matches(e)),
    [subtypeItems, level]
  );

  const { favoriteItems, otherItems } = useMemo(() => {
    const byKey = new Map(commonlyFiltered.map((e) => [e.key, e]));
    const favs: Equipment[] = [];
    for (const key of favorites) {
      const e = byKey.get(key);
      if (e) favs.push(e);
    }
    const others: Equipment[] = [];
    for (const e of byKey.values()) {
      if (!favoritesSet.has(e.key)) others.push(e);
    }
    return { favoriteItems: favs, otherItems: others };
  }, [commonlyFiltered, favorites, favoritesSet]);

  const favSearch = useSearchFilter(favoriteItems, getItemName);
  const otherSearch = useSearchFilter(otherItems, getItemName);

  const filteredCount = favSearch.filtered.length + otherSearch.filtered.length;
  const filtersActive = level.isActive || favSearch.isActive || otherSearch.isActive;

  const resetFilters = useCallback(() => {
    level.reset();
    favSearch.reset();
    otherSearch.reset();
  }, [level, favSearch, otherSearch]);

  const handleToggleFavorite = useCallback((key: string) => toggleFavorite(key), [toggleFavorite]);
  const handleCardClick = useCallback(
    (item: Equipment) => {
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

  if (subtypeItems.length === 0) {
    return (
      <Page maxWidth="lg">
        <Alert severity="info">Нет данных для отображения</Alert>
      </Page>
    );
  }

  return (
    <Page maxWidth="lg">
      <CatalogHeader
        title={title}
        summary={
          <>
            Показано: {filteredCount} из {subtypeItems.length}
            {favoriteItems.length > 0 && ` · в избранном: ${favoriteItems.length}`}
          </>
        }
      />

      <FilterPanel filtersActive={filtersActive} onReset={resetFilters}>
        <LevelRangeFilter
          min={level.min}
          max={level.max}
          applied={level.applied}
          onCommit={level.commit}
        />
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
              getKey={(e) => e.key}
              onReorder={reorderFavorites}
              renderCard={(item) => (
                <SortableEquipmentCard
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
        title={favoriteItems.length > 0 ? allSectionTitle : soleSectionTitle}
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
              <EquipmentCard
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

      <EquipmentDetail
        item={selectedItem}
        onClose={() => {
          setSelectedItem(null);
          clearOpen();
        }}
      />
    </Page>
  );
}
