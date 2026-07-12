import type { ReactNode } from 'react';
import { TileLink, IconSlot, TileTitle } from './Tile.styles';

interface TileProps {
  to: string;
  title: string;
  icon: ReactNode;
}

export function Tile({ to, title, icon }: TileProps) {
  return (
    <TileLink to={to}>
      <IconSlot>{icon}</IconSlot>
      <TileTitle>{title}</TileTitle>
    </TileLink>
  );
}
