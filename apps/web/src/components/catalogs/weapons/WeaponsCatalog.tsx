import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, CircularProgress } from '@mui/material';
import { useWeaponsStore } from '@/stores/weapons/store';
import type { Weapon } from '@/types/weapon';
import { CatalogHeader } from '@/components/catalog/CatalogHeader';
import { CatalogSection } from '@/components/catalog/CatalogSection';
import { CatalogGrid } from '@/components/catalog/CatalogGrid';
import { FavoritesDnDSection } from '@/components/catalog/FavoritesDnDSection';
import { FilterPanel } from '@/components/catalog/FilterPanel';
import { SearchField } from '@/components/catalog/SearchField';
import { Page, CenteredPage } from '@/components/catalog/CatalogPage.styles';
import { FilterGroup, FilterLabel } from '@/components/catalog/FilterPanel.styles';
import { SectionDivider } from '@/components/catalog/CatalogSection.styles';
import { LevelRangeFilter } from '@/components/catalog/LevelRangeFilter';
import { PairToggleGroup } from '@/components/catalog/PairToggleGroup';
import { useSearchFilter } from '@/components/catalog/hooks/useSearchFilter';
import { useLevelRangeFilter } from '@/components/catalog/hooks/useLevelRangeFilter';
import { useDeepLinkOpen } from '@/components/catalog/hooks/useDeepLinkOpen';
import { usePairFilter, type FilterPair } from '@/components/catalog/hooks/usePairFilter';
import { WeaponCard } from './WeaponCard';
import { WeaponDetail } from './WeaponDetail';
import { SortableWeaponCard } from './SortableWeaponCard';

const getWeaponName = (w: Weapon) => w.name;
const getWeaponLevel = (w: Weapon) => w.requiredLevel;

/**
 * Фильтр по группе строится на CSS-категории оружия из вики (`w.category`).
 * Это единственное поле, однозначно разделяющее оружие: поле `group` в
 * вики склеенное («Пулемет, Пушка») и одинаково у обеих категорий пары —
 * фильтровать по нему бесполезно (см. issue про Мортиру + Пулемет крп.).
 *
 * Пары и подписи зашиты: список категорий стабилен, вики их редко меняет.
 * Порядок в списке = порядок отрисовки в UI.
 */
const CATEGORY_PAIRS: FilterPair<string>[] = [
  {
    key: 'bullet+missile',
    label: 'Пулемет + Пушка',
    values: ['bullet', 'missile'],
  },
  {
    key: 'mortar+bullet-heavy',
    label: 'Мортира + Пулемет крупнокалиберный',
    values: ['mortar', 'bullet-heavy'],
  },
  {
    key: 'howitzer+launcher',
    label: 'Гаубица + Гранатомет',
    values: ['howitzer', 'launcher'],
  },
  {
    key: 'bullet-eng+missile-eng',
    label: 'Пулемет энрг + Пушка энрг',
    values: ['bullet-eng', 'missile-eng'],
  },
  {
    key: 'howitzer-eng+launcher-eng',
    label: 'Гаубица энрг + Гранатомет энрг',
    values: ['howitzer-eng', 'launcher-eng'],
  },
  { key: 'rk+rk-eng', label: 'Рк + Рк энрг', values: ['rk', 'rk-eng'] },
  { key: 'faser+empp', label: 'Фазер + ЭМПП', values: ['faser', 'empp'] },
  { key: 'laser', label: 'Лазер', values: ['laser'] },
  { key: 'repair', label: 'Ремонтная пушка', values: ['repair'] },
];

/** Русские подписи для CSS-категорий (используются как текст кнопок). */
const CATEGORY_LABELS: Record<string, string> = {
  bullet: 'Пулемет',
  missile: 'Пушка',
  mortar: 'Мортира',
  'bullet-heavy': 'Пулемет крупнокалиберный',
  'bullet-eng': 'Пулемет энрг',
  'missile-eng': 'Пушка энрг',
  howitzer: 'Гаубица',
  launcher: 'Гранатомет',
  'howitzer-eng': 'Гаубица энрг',
  'launcher-eng': 'Гранатомет энрг',
  rk: 'Рк',
  'rk-eng': 'Рк энрг',
  faser: 'Фазер',
  empp: 'ЭМПП',
  laser: 'Лазер',
  repair: 'Ремонтная пушка',
};

/** Русский label для отображения — из маппинга; фолбэк — сама category. */
function labelFor(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

const PAIRS_WITH_LABELS: FilterPair<string>[] = CATEGORY_PAIRS.map((p) => ({
  key: p.key,
  label: p.label,
  values:
    p.values.length === 2
      ? [labelFor(p.values[0]), labelFor(p.values[1])]
      : [labelFor(p.values[0])],
}));

/** Обратный маппинг label → category для matches. */
const LABEL_TO_CATEGORY: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_LABELS).map(([c, l]) => [l, c])
);

export function WeaponsCatalog() {
  const {
    weapons,
    favorites,
    isLoading,
    error,
    initializeWeapons,
    toggleFavorite,
    reorderFavorites,
  } = useWeaponsStore();
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const { openInUrl, clearOpen } = useDeepLinkOpen(
    weapons,
    (w) => w.key,
    setSelectedWeapon,
    () => setSelectedWeapon(null)
  );

  useEffect(() => {
    if (weapons.length === 0 && !isLoading) {
      initializeWeapons();
    }
  }, [weapons.length, isLoading, initializeWeapons]);

  const groupFilter = usePairFilter<string>(PAIRS_WITH_LABELS);
  const level = useLevelRangeFilter({ items: weapons, getLevel: getWeaponLevel });
  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  /**
   * Активные категории (CSS-slug) — трансформируем русские labels из
   * groupFilter.activeValues обратно в CSS-slug через LABEL_TO_CATEGORY.
   * Для weapon сравниваем именно его `category` — оно уникально для
   * каждой сущности (в отличие от склеенного `group`).
   */
  const activeCategories = useMemo(
    () => new Set(groupFilter.activeValues.map((label) => LABEL_TO_CATEGORY[label] ?? label)),
    [groupFilter.activeValues]
  );

  const commonlyFiltered = useMemo(() => {
    return weapons.filter((w) => {
      if (groupFilter.isActive && !activeCategories.has(w.category)) return false;
      if (!level.matches(w)) return false;
      return true;
    });
  }, [weapons, groupFilter.isActive, activeCategories, level]);

  const { favoriteWeapons, otherWeapons } = useMemo(() => {
    const byKey = new Map(commonlyFiltered.map((w) => [w.key, w]));
    const favs: Weapon[] = [];
    for (const key of favorites) {
      const w = byKey.get(key);
      if (w) favs.push(w);
    }
    const others: Weapon[] = [];
    for (const w of byKey.values()) {
      if (!favoritesSet.has(w.key)) others.push(w);
    }
    return { favoriteWeapons: favs, otherWeapons: others };
  }, [commonlyFiltered, favorites, favoritesSet]);

  const favSearch = useSearchFilter(favoriteWeapons, getWeaponName);
  const otherSearch = useSearchFilter(otherWeapons, getWeaponName);

  const filteredCount = favSearch.filtered.length + otherSearch.filtered.length;
  const filtersActive =
    groupFilter.isActive || level.isActive || favSearch.isActive || otherSearch.isActive;

  const resetFilters = useCallback(() => {
    groupFilter.reset();
    level.reset();
    favSearch.reset();
    otherSearch.reset();
  }, [groupFilter, level, favSearch, otherSearch]);

  const handleToggleFavorite = useCallback((key: string) => toggleFavorite(key), [toggleFavorite]);
  const handleCardClick = useCallback(
    (weapon: Weapon) => {
      setSelectedWeapon(weapon);
      openInUrl(weapon.key);
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

  if (weapons.length === 0) {
    return (
      <Page maxWidth="lg">
        <Alert severity="info">Нет данных для отображения</Alert>
      </Page>
    );
  }

  return (
    <Page maxWidth="lg">
      <CatalogHeader
        title="Каталог оружия"
        summary={
          <>
            Показано: {filteredCount} из {weapons.length}
            {favoriteWeapons.length > 0 && ` · в избранном: ${favoriteWeapons.length}`}
          </>
        }
      />

      <FilterPanel filtersActive={filtersActive} onReset={resetFilters}>
        <FilterGroup>
          <FilterLabel>Группа:</FilterLabel>
          <PairToggleGroup
            pairs={PAIRS_WITH_LABELS}
            state={groupFilter.state}
            onToggleValue={groupFilter.toggleValue}
          />
        </FilterGroup>

        <LevelRangeFilter
          min={level.min}
          max={level.max}
          applied={level.applied}
          onCommit={level.commit}
        />
      </FilterPanel>

      {favoriteWeapons.length > 0 && (
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
              getKey={(w) => w.key}
              onReorder={reorderFavorites}
              renderCard={(weapon) => (
                <SortableWeaponCard
                  key={weapon.key}
                  weapon={weapon}
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
        title={favoriteWeapons.length > 0 ? 'Всё оружие' : 'Оружие'}
        search={
          <SearchField
            value={otherSearch.query}
            onChange={otherSearch.setQuery}
            placeholder={favoriteWeapons.length > 0 ? 'Поиск по остальным' : 'Поиск по названию'}
          />
        }
      >
        {otherSearch.filtered.length === 0 ? (
          <Alert severity="info">
            {filtersActive ? 'Ничего не найдено по фильтрам' : 'Ничего не найдено'}
          </Alert>
        ) : (
          <CatalogGrid>
            {otherSearch.filtered.map((weapon) => (
              <WeaponCard
                key={weapon.key}
                weapon={weapon}
                isFavorite={false}
                onToggleFavorite={handleToggleFavorite}
                onClick={handleCardClick}
              />
            ))}
          </CatalogGrid>
        )}
      </CatalogSection>

      <WeaponDetail
        weapon={selectedWeapon}
        onClose={() => {
          setSelectedWeapon(null);
          clearOpen();
        }}
      />
    </Page>
  );
}
