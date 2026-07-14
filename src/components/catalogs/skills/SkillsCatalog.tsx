import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, CircularProgress } from '@mui/material';
import { useSkillsStore } from '@/stores/skills/store';
import type { Skill } from '@/types/skill';
import { CatalogHeader } from '@/components/catalog/CatalogHeader';
import { CatalogSection } from '@/components/catalog/CatalogSection';
import { CatalogGrid } from '@/components/catalog/CatalogGrid';
import { FavoritesDnDSection } from '@/components/catalog/FavoritesDnDSection';
import { Page, CenteredPage } from '@/components/catalog/CatalogPage.styles';
import { SectionDivider } from '@/components/catalog/CatalogSection.styles';
import { useDeepLinkOpen } from '@/components/catalog/hooks/useDeepLinkOpen';
import { SkillCard } from './SkillCard';
import { SkillDetail } from './SkillDetail';
import { SortableSkillCard } from './SortableSkillCard';

export function SkillsCatalog() {
  const {
    skills,
    favorites,
    isLoading,
    error,
    initializeSkills,
    toggleFavorite,
    reorderFavorites,
  } = useSkillsStore();
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const { openInUrl, clearOpen } = useDeepLinkOpen(
    skills,
    (s) => s.key,
    setSelectedSkill,
    () => setSelectedSkill(null)
  );

  useEffect(() => {
    if (skills.length === 0 && !isLoading) {
      initializeSkills();
    }
  }, [skills.length, isLoading, initializeSkills]);

  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  const { favoriteSkills, otherSkills } = useMemo(() => {
    const byKey = new Map(skills.map((s) => [s.key, s]));
    const favs: Skill[] = [];
    for (const key of favorites) {
      const s = byKey.get(key);
      if (s) favs.push(s);
    }
    const others: Skill[] = [];
    for (const s of byKey.values()) {
      if (!favoritesSet.has(s.key)) others.push(s);
    }
    return { favoriteSkills: favs, otherSkills: others };
  }, [skills, favorites, favoritesSet]);

  const handleToggleFavorite = useCallback((key: string) => toggleFavorite(key), [toggleFavorite]);
  const handleCardClick = useCallback(
    (s: Skill) => {
      setSelectedSkill(s);
      openInUrl(s.key);
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

  if (skills.length === 0) {
    return (
      <Page maxWidth="lg">
        <Alert severity="info">Нет данных для отображения</Alert>
      </Page>
    );
  }

  return (
    <Page maxWidth="lg">
      <CatalogHeader
        title="Каталог навыков"
        summary={
          <>
            Показано: {skills.length}
            {favoriteSkills.length > 0 && ` · в избранном: ${favoriteSkills.length}`}
          </>
        }
      />

      {favoriteSkills.length > 0 && (
        <>
          <CatalogSection title="Избранные">
            <FavoritesDnDSection
              items={favoriteSkills}
              getKey={(s) => s.key}
              onReorder={reorderFavorites}
              renderCard={(s) => (
                <SortableSkillCard
                  key={s.key}
                  skill={s}
                  onToggleFavorite={handleToggleFavorite}
                  onClick={handleCardClick}
                />
              )}
            />
          </CatalogSection>
          <SectionDivider />
        </>
      )}

      <CatalogSection title={favoriteSkills.length > 0 ? 'Все навыки' : 'Навыки'}>
        <CatalogGrid>
          {otherSkills.map((s) => (
            <SkillCard
              key={s.key}
              skill={s}
              isFavorite={false}
              onToggleFavorite={handleToggleFavorite}
              onClick={handleCardClick}
            />
          ))}
        </CatalogGrid>
      </CatalogSection>

      <SkillDetail
        skill={selectedSkill}
        onClose={() => {
          setSelectedSkill(null);
          clearOpen();
        }}
      />
    </Page>
  );
}
