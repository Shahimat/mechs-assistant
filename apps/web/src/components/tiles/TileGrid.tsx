import type { ReactNode } from 'react';
import { Grid } from './TileGrid.styles';

interface TileGridProps {
  children: ReactNode;
}

export function TileGrid({ children }: TileGridProps) {
  return <Grid>{children}</Grid>;
}
