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

  /** Проверяет вхождение любого из нескольких значений (для сущностей с multi-tag). */
  const matchesAny = useCallback(
    (values: Value[] | undefined) => {
      if (selected.length === 0) return true;
      if (!values || values.length === 0) return false;
      return values.some((v) => selected.includes(v));
    },
    [selected]
  );

  return { selected, setSelected, isActive, reset, matches, matchesAny };
}
