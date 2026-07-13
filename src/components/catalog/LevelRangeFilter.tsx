import { memo, useState } from 'react';
import { Slider } from '@mui/material';
import { FilterGroup } from './FilterPanel.styles';
import { LevelLabel, LevelSliderWrap } from './LevelRangeFilter.styles';

interface LevelRangeFilterProps {
  min: number;
  max: number;
  applied: [number, number];
  onCommit: (value: [number, number]) => void;
}

function LevelRangeFilterInner({ min, max, applied, onCommit }: LevelRangeFilterProps) {
  const [local, setLocal] = useState<[number, number]>(applied);

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

// key на границе компонента даёт reset локального state, когда родитель
// меняет applied извне (reset фильтра, смена набора данных). Без этого
// пришлось бы синхронизировать через useEffect + setState — паттерн,
// который react-hooks/set-state-in-effect справедливо запрещает.
function LevelRangeFilterImpl(props: LevelRangeFilterProps) {
  return <LevelRangeFilterInner key={`${props.applied[0]}|${props.applied[1]}`} {...props} />;
}

export const LevelRangeFilter = memo(LevelRangeFilterImpl);
