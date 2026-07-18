import type { ReactNode } from 'react';
import { Button } from '@mui/material';
import { FilterAltOff } from '@mui/icons-material';
import { Panel, ResetButtonSlot } from './FilterPanel.styles';

interface FilterPanelProps {
  children: ReactNode;
  filtersActive: boolean;
  onReset: () => void;
}

export function FilterPanel({ children, filtersActive, onReset }: FilterPanelProps) {
  return (
    <Panel>
      {children}
      <ResetButtonSlot active={filtersActive}>
        <Button size="small" variant="text" startIcon={<FilterAltOff />} onClick={onReset}>
          Сбросить
        </Button>
      </ResetButtonSlot>
    </Panel>
  );
}
