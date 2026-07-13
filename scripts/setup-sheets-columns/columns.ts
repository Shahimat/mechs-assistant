/**
 * Канонические наборы колонок листов Google Sheets по каталогам.
 * Первая строка — key (заголовок), вторая — description (комментарий
 * для редакторов). Данные редакторов — начиная с Row 3.
 *
 * Порядок колонок в массиве = порядок в Sheets слева-направо.
 * Добавление новой колонки — append в конец, чтобы не ломать
 * существующие индексы редакторов.
 */

export interface ColumnSpec {
  name: string;
  description: string;
}

export const MECHS_COLUMNS: ColumnSpec[] = [
  { name: 'key', description: 'Ключ меха (garpiy_1, kazuar…). Копируется из детали в UI' },
  { name: 'name', description: 'Полное название с уровнем' },
  { name: 'model', description: 'Модель без уровня' },
  { name: 'type', description: 'Тип: боец / транспортник / добытчик / разведчик' },
  { name: 'requiredLevel', description: 'Требуемый уровень персонажа' },
  { name: 'stats.durability', description: 'Прочность (HP)' },
  { name: 'stats.capacity', description: 'Вместимость трюма' },
  { name: 'stats.maxCapacity', description: 'Макс. вместимость под грузом (для транспортников)' },
  { name: 'stats.speed', description: 'Скорость' },
  { name: 'stats.maxSpeed', description: 'Скорость после макс. прокачки' },
  { name: 'stats.armor', description: 'Броня' },
  { name: 'stats.energyFields', description: 'Энергетические поля' },
  { name: 'stats.regenerationPerMinute', description: 'Восстановление прочности в минуту' },
  { name: 'stats.additionalInvulnerability', description: 'Добавочная неуязвимость (секунды)' },
  { name: 'stats.additionalAcceleration', description: 'Добавочное ускорение (секунды)' },
  { name: 'buyPrice.bonds', description: 'Цена покупки в бонах' },
  { name: 'buyPrice.regls', description: 'Цена покупки в реглах' },
  { name: 'sellPrice.bonds', description: 'Цена продажи в бонах (базовая, без навыка «Торговля»)' },
  { name: 'sellPrice.regls', description: 'Цена продажи в реглах' },
  { name: 'upgradePrice.bonds', description: 'Цена прокачки в бонах' },
  { name: 'upgradePrice.regls', description: 'Цена прокачки в реглах' },
  { name: 'upgradeReglPercent', description: '% реглов от общей цены прокачки' },
  { name: 'itemUpgradePercent', description: '% прокачки предметов' },
  {
    name: 'extraSlots',
    description: 'Доп. слоты меха — список через ; (например «оружие; двигатель»)',
  },
  {
    name: 'features',
    description: 'Особенности — список через ; (например «Рывок охотника; Ускорение»)',
  },
  { name: 'backSideDamage', description: 'Урон в спину/бок в %' },
  { name: 'howitzerDamage', description: 'Урон от гаубиц в %' },
  { name: 'missChance', description: 'Вероятность промаха в %' },
  { name: 'description', description: 'Свободное описание меха' },
  { name: 'wikiUrl', description: 'URL детальной страницы вики' },
  { name: 'iconPath', description: 'Путь к иконке (например data/icons/mechs/…)' },
  { name: 'source_note', description: 'Комментарий редактора (не идёт в JSON)' },
];

export const WEAPONS_COLUMNS: ColumnSpec[] = [
  { name: 'key', description: 'Ключ оружия (translit от имени). Копируется из детали в UI' },
  { name: 'name', description: 'Полное название оружия (с моделью/уровнем, если есть)' },
  { name: 'model', description: 'Модель без уровня (например «Пушка», «Ракетница»)' },
  {
    name: 'category',
    description:
      'CSS-категория из вики: bullet / missile / mortar / bullet-heavy / bullet-eng / missile-eng / howitzer / launcher / howitzer-eng / launcher-eng / rk / rk-eng / laser / repair / faser / empp',
  },
  {
    name: 'group',
    description:
      'Группа орудий из вики (может быть парой через запятую: «Мортира, Пулемет крупнокалиберный»)',
  },
  {
    name: 'slot',
    description: 'Слот установки («Орудие» и т.п.) — из поля «Устанавливается в слот»',
  },
  { name: 'requiredLevel', description: 'Требуемый уровень персонажа' },
  { name: 'stats.damageMin', description: 'Урон/ремонт, нижняя граница' },
  { name: 'stats.damageMax', description: 'Урон/ремонт, верхняя граница' },
  { name: 'stats.range', description: 'Дальность стрельбы' },
  { name: 'stats.minRange', description: 'Мёртвая зона (минимальная дистанция) у пушек/гаубиц' },
  { name: 'stats.energyConsumption', description: 'Энергопотребление за выстрел' },
  { name: 'stats.rateOfFire', description: 'Скорострельность (выстрелов в минуту)' },
  {
    name: 'stats.ammo',
    description: 'Боезапас (снаряды/заряд/запчасти для ремпушек). Пусто = бесконечно',
  },
  { name: 'stats.durability', description: 'Прочность оружия' },
  { name: 'stats.weight', description: 'Вес' },
  { name: 'buyPrice.bonds', description: 'Цена покупки в бонах' },
  { name: 'buyPrice.regls', description: 'Цена покупки в реглах' },
  { name: 'sellPrice.bonds', description: 'Цена продажи в бонах (базовая, без «Торговли»)' },
  { name: 'sellPrice.regls', description: 'Цена продажи в реглах' },
  { name: 'craftFromBlueprints', description: 'Крафтится из чертежей — список через ;' },
  { name: 'description', description: 'Свободное описание оружия' },
  { name: 'iconPath', description: 'Путь к иконке (например data/icons/weapons/…)' },
  { name: 'wikiUrl', description: 'URL детальной страницы вики' },
  { name: 'source_note', description: 'Комментарий редактора (не идёт в JSON)' },
];

export const EQUIPMENT_COLUMNS: ColumnSpec[] = [
  { name: 'key', description: 'Ключ записи (translit от имени). Копируется из детали в UI' },
  { name: 'name', description: 'Полное название с моделью/уровнем' },
  { name: 'model', description: 'Модель без уровня' },
  {
    name: 'family',
    description: 'Верхний уровень CSS-класса из вики: electronic / special / energy / defence',
  },
  {
    name: 'subtype',
    description:
      'Подтип: computer (чипы) / extractor (буры) / cargo (трюма) / accumulator (накопители) / generator (реакторы) / armour (броня) / shield (энергощиты)',
  },
  {
    name: 'slot',
    description: 'Слот установки — из поля «Устанавливается в слот» (например «Доп»)',
  },
  { name: 'requiredLevel', description: 'Требуемый уровень персонажа' },
  {
    name: 'requiredRobotType',
    description: 'Ограничение по классу меха («Добытчик» у буров)',
  },
  { name: 'stats.durability', description: 'Прочность' },
  { name: 'stats.weight', description: 'Вес' },
  {
    name: 'stats.primary',
    description:
      'Subtype-specific ключевой параметр (Мощность подъема / Трюм / Емкость / Мощность / Броня / Мощность поля)',
  },
  {
    name: 'stats.primaryLabel',
    description: 'Русская подпись stats.primary из вики. У чипов может быть пусто',
  },
  { name: 'buyPrice.bonds', description: 'Цена покупки в бонах' },
  { name: 'buyPrice.regls', description: 'Цена покупки в реглах' },
  { name: 'sellPrice.bonds', description: 'Цена продажи в бонах (базовая, без «Торговли»)' },
  { name: 'sellPrice.regls', description: 'Цена продажи в реглах' },
  { name: 'craftFromBlueprints', description: 'Крафтится из чертежей — список через ;' },
  { name: 'description', description: 'Свободное описание' },
  { name: 'iconPath', description: 'Путь к иконке (например data/icons/equipment/…)' },
  { name: 'wikiUrl', description: 'URL детальной страницы вики' },
  { name: 'source_note', description: 'Комментарий редактора (не идёт в JSON)' },
];

/** Регистр колонок по slug каталога. */
export const COLUMNS_BY_SLUG: Record<string, ColumnSpec[]> = {
  robots: MECHS_COLUMNS, // slug=robots, но лист=mechs (см. catalogs.config)
  weapons: WEAPONS_COLUMNS,
  equipment: EQUIPMENT_COLUMNS,
};
