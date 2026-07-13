import type { FilterPair } from '@/components/catalog/hooks/usePairFilter';
import type { ComponentKind } from '@/types/component';

/** Русские подписи для kind — используются как в chip'ах, так и в фильтре. */
export const KIND_LABELS: Record<ComponentKind, string> = {
  base: 'Базовый',
  composite: 'Составной',
};

/** Пары для PairToggleGroup — 2 одиночные капсулы. */
const KIND_PAIRS: FilterPair<string>[] = [
  { key: 'base', label: 'Базовый', values: ['base'] },
  { key: 'composite', label: 'Составной', values: ['composite'] },
];

function labelFor(kind: string): string {
  return KIND_LABELS[kind as ComponentKind] ?? kind;
}

export const PAIRS_WITH_LABELS: FilterPair<string>[] = KIND_PAIRS.map((p) => ({
  key: p.key,
  label: p.label,
  values: [labelFor(p.values[0])],
}));

/** Обратный маппинг label → kind. */
export const LABEL_TO_KIND: Record<string, string> = Object.fromEntries(
  Object.entries(KIND_LABELS).map(([k, l]) => [l, k])
);
