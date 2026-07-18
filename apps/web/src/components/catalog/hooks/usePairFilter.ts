import { useCallback, useMemo, useState } from 'react';

/**
 * Единица фильтра «по группе»: одиночное значение или пара, ходящих
 * вместе в разметке (одна капсула с двумя половинами).
 */
export interface FilterPair<T extends string> {
  /** Стабильный id (используется как ключ в state). */
  key: string;
  /** Метка (для label в UI, если понадобится). */
  label: string;
  /** 1 или 2 значения. При 1 — одиночная кнопка, при 2 — split-капсула. */
  values: [T] | [T, T];
}

/**
 * Стейт единицы фильтра:
 *   none    — не выбран.
 *   both    — активны все значения (для одиночного = единственное).
 *   only-a  — активно только values[0] (только для пар).
 *   only-b  — активно только values[1] (только для пар).
 */
export type PairState = 'none' | 'both' | 'only-a' | 'only-b';

export function usePairFilter<T extends string>(pairs: FilterPair<T>[]) {
  const [state, setState] = useState<Record<string, PairState>>({});

  /**
   * Клик по половине:
   *   none    + любой клик → both (первый клик активирует всю пару).
   *   иначе — toggle именно кликнутой стороны:
   *     both     + click X → only-<other>   (снимает X, оставляет Y).
   *     only-X   + click X → none           (снимает X, ничего не остаётся).
   *     only-Y   + click X → both           (добавляет X к Y).
   * Для одиночного (values.length === 1) — none ↔ both.
   */
  const toggleValue = useCallback((pairKey: string, side: 'a' | 'b') => {
    setState((prev) => {
      const current = prev[pairKey] ?? 'none';
      if (current === 'none') {
        return { ...prev, [pairKey]: 'both' };
      }
      const isAActive = current === 'both' || current === 'only-a';
      const isBActive = current === 'both' || current === 'only-b';
      const newA = side === 'a' ? !isAActive : isAActive;
      const newB = side === 'b' ? !isBActive : isBActive;
      let next: PairState;
      if (newA && newB) next = 'both';
      else if (newA) next = 'only-a';
      else if (newB) next = 'only-b';
      else next = 'none';
      return { ...prev, [pairKey]: next };
    });
  }, []);

  const activeValues = useMemo(() => {
    const set = new Set<T>();
    for (const p of pairs) {
      const s = state[p.key] ?? 'none';
      if (s === 'both') {
        for (const v of p.values) set.add(v);
      } else if (s === 'only-a') {
        set.add(p.values[0]);
      } else if (s === 'only-b' && p.values.length === 2) {
        set.add(p.values[1]);
      }
    }
    return [...set];
  }, [pairs, state]);

  const isActive = activeValues.length > 0;
  const reset = useCallback(() => setState({}), []);

  /** Проверяет вхождение хотя бы одного из значений сущности в активный набор. */
  const matchesAny = useCallback(
    (values: T[] | undefined) => {
      if (!isActive) return true;
      if (!values || values.length === 0) return false;
      return values.some((v) => (activeValues as string[]).includes(v));
    },
    [activeValues, isActive]
  );

  return {
    state,
    toggleValue,
    activeValues,
    isActive,
    reset,
    matchesAny,
  };
}
