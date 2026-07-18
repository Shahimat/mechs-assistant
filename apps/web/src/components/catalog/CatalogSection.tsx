import type { ReactNode } from 'react';
import { SectionHeader, SectionTitle, SectionSearch } from './CatalogSection.styles';

interface CatalogSectionProps {
  title: string;
  search?: ReactNode;
  children: ReactNode;
}

export function CatalogSection({ title, search, children }: CatalogSectionProps) {
  return (
    <>
      <SectionHeader>
        <SectionTitle>{title}</SectionTitle>
        {search != null && <SectionSearch>{search}</SectionSearch>}
      </SectionHeader>
      {children}
    </>
  );
}
