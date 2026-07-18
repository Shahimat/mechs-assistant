import type { BlueprintCategory } from '@/types/blueprint';

/** Русские подписи для category — используются в chip'е карточки/детали
 *  и в лейблах toggle-кнопок фильтра. */
export const CATEGORY_LABELS: Record<BlueprintCategory, string> = {
  mech: 'Мехи',
  weapon: 'Оружие',
  equipment: 'Оборудование',
  component: 'Компоненты',
  pack: 'Паки',
  upgrade: 'Апгрейды',
  teleport: 'Телепорты',
};

/** Опции для ToggleButtonGroup фильтра — раздельные категории (по аналогии
 *  с TYPE_OPTIONS у мехов). Порядок отражает семантическую близость:
 *  сначала мехи как самая ценная сборка, потом оружие/оборудование,
 *  затем сборочные материалы и расходники. */
export const CATEGORY_OPTIONS: Array<{ value: BlueprintCategory; label: string }> = [
  { value: 'mech', label: CATEGORY_LABELS.mech },
  { value: 'weapon', label: CATEGORY_LABELS.weapon },
  { value: 'equipment', label: CATEGORY_LABELS.equipment },
  { value: 'component', label: CATEGORY_LABELS.component },
  { value: 'upgrade', label: CATEGORY_LABELS.upgrade },
  { value: 'pack', label: CATEGORY_LABELS.pack },
  { value: 'teleport', label: CATEGORY_LABELS.teleport },
];
