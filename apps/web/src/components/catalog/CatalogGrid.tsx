import type { ReactNode } from 'react';
import { Grid } from './CatalogGrid.styles';

interface CatalogGridProps {
  children: ReactNode;
}

export function CatalogGrid({ children }: CatalogGridProps) {
  return <Grid>{children}</Grid>;
}
