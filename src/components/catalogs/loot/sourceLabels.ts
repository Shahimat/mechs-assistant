import type { FilterPair } from '@/components/catalog/hooks/usePairFilter';
import type { LootSource } from '@/types/loot';

/** Русские подписи источников — для chip'ов в карточке и лейблов фильтра. */
export const SOURCE_LABELS: Record<LootSource, string> = {
  monster: 'Монстры',
  mole: 'Кроты',
  pirate: 'Пираты',
};

/** 3 одиночные капсулы для PairToggleGroup. */
const SOURCE_PAIRS: FilterPair<string>[] = [
  { key: 'monster', label: 'Монстры', values: ['monster'] },
  { key: 'mole', label: 'Кроты', values: ['mole'] },
  { key: 'pirate', label: 'Пираты', values: ['pirate'] },
];

function labelFor(source: string): string {
  return SOURCE_LABELS[source as LootSource] ?? source;
}

export const PAIRS_WITH_LABELS: FilterPair<string>[] = SOURCE_PAIRS.map((p) => ({
  key: p.key,
  label: p.label,
  values: [labelFor(p.values[0])],
}));

/** Обратный маппинг label → source. */
export const LABEL_TO_SOURCE: Record<string, string> = Object.fromEntries(
  Object.entries(SOURCE_LABELS).map(([s, l]) => [l, s])
);
