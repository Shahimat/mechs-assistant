import { useCallback, useMemo, useState } from 'react';

export function useSearchFilter<T>(items: T[], getName: (item: T) => string) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return items;
    return items.filter((item) => getName(item).toLowerCase().includes(trimmed));
  }, [items, query, getName]);

  const isActive = query.trim().length > 0;
  const reset = useCallback(() => setQuery(''), []);

  return { query, setQuery, filtered, isActive, reset };
}
