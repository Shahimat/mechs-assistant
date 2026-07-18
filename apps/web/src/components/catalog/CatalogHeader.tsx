import type { ReactNode } from 'react';
import { Typography } from '@mui/material';
import { Summary } from './CatalogHeader.styles';

interface CatalogHeaderProps {
  title: string;
  summary?: ReactNode;
}

export function CatalogHeader({ title, summary }: CatalogHeaderProps) {
  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        {title}
      </Typography>
      {summary != null && <Summary>{summary}</Summary>}
    </>
  );
}
