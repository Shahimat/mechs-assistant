import { useCallback, useMemo, useState } from 'react';

interface UseLevelRangeArgs<T> {
  items: T[];
  getLevel: (item: T) => number | null | undefined;
  defaultRange?: [number, number];
}

export function useLevelRangeFilter<T>({
  items,
  getLevel,
  defaultRange = [1, 100],
}: UseLevelRangeArgs<T>) {
  const [range, setRange] = useState<[number, number] | null>(null);

  const { min, max } = useMemo(() => {
    if (items.length === 0) {
      return { min: defaultRange[0], max: defaultRange[1] };
    }
    const levels = items.map(getLevel).filter((l): l is number => typeof l === 'number');
    if (levels.length === 0) {
      return { min: defaultRange[0], max: defaultRange[1] };
    }
    return { min: Math.min(...levels), max: Math.max(...levels) };
  }, [items, getLevel, defaultRange]);

  // range === null означает «фильтр не тронут» — applied совпадает с
  // текущим [min, max], фильтр не активен. Отдельный effect для инициализации
  // range при первом появлении данных не нужен: applied всё равно вернёт
  // актуальный [min, max], а isActive остаётся false до реального commit.
  const applied = useMemo<[number, number]>(() => range ?? [min, max], [range, min, max]);
  const isActive = applied[0] !== min || applied[1] !== max;
  const reset = useCallback(() => setRange([min, max]), [min, max]);

  const matches = useCallback(
    (item: T) => {
      if (!isActive) return true;
      const level = getLevel(item);
      if (level == null) return true;
      return level >= applied[0] && level <= applied[1];
    },
    [applied, isActive, getLevel]
  );

  const commit = useCallback((next: [number, number]) => setRange(next), []);

  return { min, max, applied, isActive, matches, commit, reset };
}
