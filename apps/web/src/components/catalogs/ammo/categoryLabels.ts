import type { FilterPair } from '@/components/catalog/hooks/usePairFilter';

/**
 * Русские подписи для CSS-slug'ов оружия — те же, что используются в
 * `WeaponsCatalog.tsx`. Дублируется здесь на время реализации ammo;
 * вынос в общую утилиту `src/utils/weaponCategories.ts` — отдельная
 * фаза refactor (см. active.todo).
 *
 * `laser` отсутствует в этой таблице — у него нет боезапаса
 * (безлимитная энергия), значит и в UI-фильтре не появляется.
 */
export const CATEGORY_LABELS: Record<string, string> = {
  bullet: 'Пулемет',
  missile: 'Пушка',
  mortar: 'Мортира',
  'bullet-heavy': 'Пулемет крупнокалиберный',
  'bullet-eng': 'Пулемет энрг',
  'missile-eng': 'Пушка энрг',
  howitzer: 'Гаубица',
  launcher: 'Гранатомет',
  'howitzer-eng': 'Гаубица энрг',
  'launcher-eng': 'Гранатомет энрг',
  rk: 'Рк',
  'rk-eng': 'Рк энрг',
  faser: 'Фазер',
  empp: 'ЭМПП',
  repair: 'Запчасти',
};

/**
 * Пары для PairToggleGroup. Список повторяет weapons + одиночная
 * «Запчасти» (repair). `laser` — исключён (нет ammo).
 * Значения — CSS-slug'и; UI-компоненту пары передаются с русскими
 * подписями через `PAIRS_WITH_LABELS`.
 */
const CATEGORY_PAIRS: FilterPair<string>[] = [
  { key: 'bullet+missile', label: 'Пулемет + Пушка', values: ['bullet', 'missile'] },
  {
    key: 'mortar+bullet-heavy',
    label: 'Мортира + Пулемет крупнокалиберный',
    values: ['mortar', 'bullet-heavy'],
  },
  {
    key: 'howitzer+launcher',
    label: 'Гаубица + Гранатомет',
    values: ['howitzer', 'launcher'],
  },
  {
    key: 'bullet-eng+missile-eng',
    label: 'Пулемет энрг + Пушка энрг',
    values: ['bullet-eng', 'missile-eng'],
  },
  {
    key: 'howitzer-eng+launcher-eng',
    label: 'Гаубица энрг + Гранатомет энрг',
    values: ['howitzer-eng', 'launcher-eng'],
  },
  { key: 'rk+rk-eng', label: 'Рк + Рк энрг', values: ['rk', 'rk-eng'] },
  { key: 'faser+empp', label: 'Фазер + ЭМПП', values: ['faser', 'empp'] },
  { key: 'repair', label: 'Запчасти', values: ['repair'] },
];

function labelFor(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

/** Пары с русскими подписями для UI. */
export const PAIRS_WITH_LABELS: FilterPair<string>[] = CATEGORY_PAIRS.map((p) => ({
  key: p.key,
  label: p.label,
  values:
    p.values.length === 2
      ? [labelFor(p.values[0]), labelFor(p.values[1])]
      : [labelFor(p.values[0])],
}));

/** Обратный маппинг label → CSS-slug для матча активных значений. */
export const LABEL_TO_CATEGORY: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_LABELS).map(([c, l]) => [l, c])
);
