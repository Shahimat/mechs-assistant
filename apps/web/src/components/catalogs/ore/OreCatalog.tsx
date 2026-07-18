import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, CircularProgress } from '@mui/material';
import { useOreStore } from '@/stores/ore/store';
import type { Ore } from '@/types/ore';
import { CatalogHeader } from '@/components/catalog/CatalogHeader';
import { CatalogSection } from '@/components/catalog/CatalogSection';
import { CatalogGrid } from '@/components/catalog/CatalogGrid';
import { FavoritesDnDSection } from '@/components/catalog/FavoritesDnDSection';
import { Page, CenteredPage } from '@/components/catalog/CatalogPage.styles';
import { SectionDivider } from '@/components/catalog/CatalogSection.styles';
import { useDeepLinkOpen } from '@/components/catalog/hooks/useDeepLinkOpen';
import { OreCard } from './OreCard';
import { OreDetail } from './OreDetail';
import { SortableOreCard } from './SortableOreCard';

export function OreCatalog() {
  const { ore, favorites, isLoading, error, initializeOre, toggleFavorite, reorderFavorites } =
    useOreStore();
  const [selectedOre, setSelectedOre] = useState<Ore | null>(null);
  const { openInUrl, clearOpen } = useDeepLinkOpen(
    ore,
    (o) => o.key,
    setSelectedOre,
    () => setSelectedOre(null)
  );

  useEffect(() => {
    if (ore.length === 0 && !isLoading) {
      initializeOre();
    }
  }, [ore.length, isLoading, initializeOre]);

  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  const { favoriteOres, otherOres } = useMemo(() => {
    const byKey = new Map(ore.map((o) => [o.key, o]));
    const favs: Ore[] = [];
    for (const key of favorites) {
      const o = byKey.get(key);
      if (o) favs.push(o);
    }
    const others: Ore[] = [];
    for (const o of byKey.values()) {
      if (!favoritesSet.has(o.key)) others.push(o);
    }
    return { favoriteOres: favs, otherOres: others };
  }, [ore, favorites, favoritesSet]);

  const handleToggleFavorite = useCallback((key: string) => toggleFavorite(key), [toggleFavorite]);
  const handleCardClick = useCallback(
    (o: Ore) => {
      setSelectedOre(o);
      openInUrl(o.key);
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

  if (ore.length === 0) {
    return (
      <Page maxWidth="lg">
        <Alert severity="info">Нет данных для отображения</Alert>
      </Page>
    );
  }

  return (
    <Page maxWidth="lg">
      <CatalogHeader
        title="Каталог руд"
        summary={
          <>
            Показано: {ore.length}
            {favoriteOres.length > 0 && ` · в избранном: ${favoriteOres.length}`}
          </>
        }
      />

      {favoriteOres.length > 0 && (
        <>
          <CatalogSection title="Избранные">
            <FavoritesDnDSection
              items={favoriteOres}
              getKey={(o) => o.key}
              onReorder={reorderFavorites}
              renderCard={(o) => (
                <SortableOreCard
                  key={o.key}
                  ore={o}
                  onToggleFavorite={handleToggleFavorite}
                  onClick={handleCardClick}
                />
              )}
            />
          </CatalogSection>
          <SectionDivider />
        </>
      )}

      <CatalogSection title={favoriteOres.length > 0 ? 'Все руды' : 'Руды'}>
        <CatalogGrid>
          {otherOres.map((o) => (
            <OreCard
              key={o.key}
              ore={o}
              isFavorite={false}
              onToggleFavorite={handleToggleFavorite}
              onClick={handleCardClick}
            />
          ))}
        </CatalogGrid>
      </CatalogSection>

      <OreDetail
        ore={selectedOre}
        onClose={() => {
          setSelectedOre(null);
          clearOpen();
        }}
      />
    </Page>
  );
}
