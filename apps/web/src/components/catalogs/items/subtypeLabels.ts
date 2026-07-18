import type { FilterPair } from '@/components/catalog/hooks/usePairFilter';
import type { Item, ItemSubtype } from '@/types/item';

/** Русские подписи для subtype — используются как в chip'е карточки,
 *  так и в лейблах капсул PairToggleGroup. */
export const SUBTYPE_LABELS: Record<ItemSubtype, string> = {
  pack: 'Паки',
  gift: 'Подарки',
  energy: 'Шокеры',
  invis: 'Невидимость',
  repair: 'Ремкомплект',
  scanner: 'Сканер',
  teleport: 'Телепортатор',
  upgrade: 'Апгрейды',
};

/** Пары для PairToggleGroup — 5 капсул, зашитые по семантике категорий. */
const SUBTYPE_PAIRS: FilterPair<string>[] = [
  { key: 'pack+gift', label: 'Наборы', values: ['pack', 'gift'] },
  { key: 'repair+energy', label: 'Восстановление', values: ['repair', 'energy'] },
  { key: 'invis+scanner', label: 'Тактика', values: ['invis', 'scanner'] },
  { key: 'teleport', label: 'Перемещение', values: ['teleport'] },
  { key: 'upgrade', label: 'Апгрейды', values: ['upgrade'] },
];

function labelFor(subtype: string): string {
  return SUBTYPE_LABELS[subtype as ItemSubtype] ?? subtype;
}

/** Пары с русскими подписями для UI (капсулы показывают SUBTYPE_LABELS). */
export const PAIRS_WITH_LABELS: FilterPair<string>[] = SUBTYPE_PAIRS.map((p) => ({
  key: p.key,
  label: p.label,
  values:
    p.values.length === 2
      ? [labelFor(p.values[0]), labelFor(p.values[1])]
      : [labelFor(p.values[0])],
}));

/** Обратный маппинг label → subtype для матча активных значений. */
export const LABEL_TO_SUBTYPE: Record<string, string> = Object.fromEntries(
  Object.entries(SUBTYPE_LABELS).map(([s, l]) => [l, s])
);

/**
 * «Главный» stat, показываемый в карточке для каждого subtype.
 * `label` — подпись слева, `getValue` — форматированное значение справа;
 * `null` для teleport (у него нет ключевого стата — карточка ограничивается
 * весом).
 */
interface PrimaryStat {
  label: string;
  getValue: (item: Item) => string | number | null;
  path: string; // для overlay-подсветки
}

export const PRIMARY_STAT: Record<ItemSubtype, PrimaryStat | null> = {
  // pack/gift — creates это массив LootDrop, в узкой карточке не
  // рендерится; полный список — в детализации чипами.
  pack: null,
  gift: null,
  energy: {
    label: 'Восст. энергии',
    getValue: (i) => i.stats.energyRestored ?? null,
    path: 'stats.energyRestored',
  },
  invis: {
    label: 'Энергопотр.',
    getValue: (i) => i.stats.energyConsumption ?? null,
    path: 'stats.energyConsumption',
  },
  repair: {
    label: 'Восстанавливает',
    getValue: (i) => i.stats.healing ?? null,
    path: 'stats.healing',
  },
  scanner: {
    label: 'Радиус скан.',
    getValue: (i) => i.stats.scanRadius ?? null,
    path: 'stats.scanRadius',
  },
  teleport: null,
  // у upgrade primary stat в карточке не показывается; providesSkill
  // рендерится отдельно в детали (когда overlay заполнен).
  upgrade: null,
};
