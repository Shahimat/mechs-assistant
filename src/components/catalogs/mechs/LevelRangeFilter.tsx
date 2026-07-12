import { memo, useEffect, useState } from 'react';
import { Slider } from '@mui/material';
import { FilterGroup } from '../../catalog/FilterPanel.styles';
import { LevelLabel, LevelSliderWrap } from './LevelRangeFilter.styles';

interface LevelRangeFilterProps {
  min: number;
  max: number;
  applied: [number, number];
  onCommit: (value: [number, number]) => void;
}

function LevelRangeFilterImpl({ min, max, applied, onCommit }: LevelRangeFilterProps) {
  const [local, setLocal] = useState<[number, number]>(applied);

  useEffect(() => {
    setLocal(applied);
  }, [applied]);

  return (
    <FilterGroup>
      <LevelLabel>
        Уровень: {local[0]}–{local[1]}
      </LevelLabel>
      <LevelSliderWrap>
        <Slider
          value={local}
          onChange={(_, val) => setLocal(val as [number, number])}
          onChangeCommitted={(_, val) => onCommit(val as [number, number])}
          min={min}
          max={max}
          size="small"
          valueLabelDisplay="off"
          disableSwap
        />
      </LevelSliderWrap>
    </FilterGroup>
  );
}

export const LevelRangeFilter = memo(LevelRangeFilterImpl);
