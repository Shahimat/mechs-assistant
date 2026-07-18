import type { FilterPair, PairState } from './hooks/usePairFilter';
import { GroupsRow, Capsule, Half, Divider } from './PairToggleGroup.styles';

interface PairToggleGroupProps<T extends string> {
  pairs: FilterPair<T>[];
  state: Record<string, PairState>;
  onToggleValue: (pairKey: string, side: 'a' | 'b') => void;
}

/**
 * Рендерит фильтр «по группе». Пары (2 значения) — split-капсула:
 * одна кнопка с двумя половинами и разделителем. Одиночные (1 значение)
 * — одна кнопка без разделителя.
 *
 * Клик по любой половине из `none` активирует все значения. Дальше —
 * клик по половине снимает противоположную (для пары), повторный клик
 * по «своей» половине снимает всё.
 */
export function PairToggleGroup<T extends string>({
  pairs,
  state,
  onToggleValue,
}: PairToggleGroupProps<T>) {
  return (
    <GroupsRow>
      {pairs.map((pair) => {
        const s: PairState = state[pair.key] ?? 'none';
        const isSingle = pair.values.length === 1;
        const isAActive = s === 'both' || s === 'only-a';

        if (isSingle) {
          return (
            <Capsule key={pair.key} role="group" aria-label={pair.label}>
              <Half
                type="button"
                active={isAActive}
                aria-pressed={isAActive}
                onClick={() => onToggleValue(pair.key, 'a')}
              >
                {pair.values[0]}
              </Half>
            </Capsule>
          );
        }

        const isBActive = s === 'both' || s === 'only-b';
        return (
          <Capsule key={pair.key} role="group" aria-label={pair.label}>
            <Half
              type="button"
              active={isAActive}
              aria-pressed={isAActive}
              onClick={() => onToggleValue(pair.key, 'a')}
            >
              {pair.values[0]}
            </Half>
            <Divider />
            <Half
              type="button"
              active={isBActive}
              aria-pressed={isBActive}
              onClick={() => onToggleValue(pair.key, 'b')}
            >
              {pair.values[1]}
            </Half>
          </Capsule>
        );
      })}
    </GroupsRow>
  );
}
