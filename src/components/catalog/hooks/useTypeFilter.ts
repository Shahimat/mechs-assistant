import { useCallback, useState } from 'react';

export function useTypeFilter<Value extends string>() {
  const [selected, setSelected] = useState<Value[]>([]);

  const isActive = selected.length > 0;
  const reset = useCallback(() => setSelected([]), []);
  const matches = useCallback(
    (value: Value | undefined) => {
      if (selected.length === 0) return true;
      if (value == null) return false;
      return selected.includes(value);
    },
    [selected]
  );

  return { selected, setSelected, isActive, reset, matches };
}
