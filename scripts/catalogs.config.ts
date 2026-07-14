/**
 * Единый конфиг каталогов проекта — источник правды путей и имён
 * для parser-wiki, parser-google-sheets и build-data. Каждый новый
 * каталог добавляется сюда одной записью; специфика (schema, resolver)
 * подключается через `parser-wiki/resolvers/<slug>.ts`.
 */

export interface CatalogConfig {
  /** Slug каталога — используется в путях `data/<slug>.json`, .build, resolvers */
  slug: string;
  /** Русская метка для логов */
  label: string;
  /** Путь parsed-JSON, куда пишет parser-wiki */
  parsedJsonPath: string;
  /** Путь overlay YAML, куда пишет parser-google-sheets */
  overlayYamlPath: string;
  /** Путь merged JSON, куда пишет build-data (импортируется UI через @build) */
  mergedJsonPath: string;
  /** Имя листа в Google Sheets (может отличаться от slug — см. robots→mechs) */
  overlaySheetName: string;
  /** Директория, куда parser-wiki качает иконки (относительно корня репо) */
  iconsDir: string;
  /** URL-префикс иконки в JSON — путь от `data/icons/` (см. iconsDir) */
  iconsUrlPrefix: string;
}

export const CATALOGS: CatalogConfig[] = [
  {
    slug: 'robots',
    label: 'Мехи',
    parsedJsonPath: 'data/robots.json',
    overlayYamlPath: 'data/overrides/mechs.yml',
    mergedJsonPath: '.build/data/robots.json',
    overlaySheetName: 'mechs',
    iconsDir: 'data/icons/mechs',
    iconsUrlPrefix: 'mechs',
  },
  {
    slug: 'weapons',
    label: 'Вооружение',
    parsedJsonPath: 'data/weapons.json',
    overlayYamlPath: 'data/overrides/weapons.yml',
    mergedJsonPath: '.build/data/weapons.json',
    overlaySheetName: 'weapons',
    iconsDir: 'data/icons/weapons',
    iconsUrlPrefix: 'weapons',
  },
  {
    slug: 'equipment',
    label: 'Оборудование',
    parsedJsonPath: 'data/equipment.json',
    overlayYamlPath: 'data/overrides/equipment.yml',
    mergedJsonPath: '.build/data/equipment.json',
    overlaySheetName: 'equipment',
    iconsDir: 'data/icons/equipment',
    iconsUrlPrefix: 'equipment',
  },
  {
    slug: 'ammo',
    label: 'Боезапас',
    parsedJsonPath: 'data/ammo.json',
    overlayYamlPath: 'data/overrides/ammo.yml',
    mergedJsonPath: '.build/data/ammo.json',
    overlaySheetName: 'ammo',
    iconsDir: 'data/icons/ammo',
    iconsUrlPrefix: 'ammo',
  },
  {
    slug: 'items',
    label: 'Используемые предметы',
    parsedJsonPath: 'data/items.json',
    overlayYamlPath: 'data/overrides/items.yml',
    mergedJsonPath: '.build/data/items.json',
    overlaySheetName: 'items',
    iconsDir: 'data/icons/items',
    iconsUrlPrefix: 'items',
  },
  {
    slug: 'ore',
    label: 'Руды',
    parsedJsonPath: 'data/ore.json',
    overlayYamlPath: 'data/overrides/ore.yml',
    mergedJsonPath: '.build/data/ore.json',
    overlaySheetName: 'ore',
    iconsDir: 'data/icons/ore',
    iconsUrlPrefix: 'ore',
  },
  {
    slug: 'components',
    label: 'Компоненты',
    parsedJsonPath: 'data/components.json',
    overlayYamlPath: 'data/overrides/components.yml',
    mergedJsonPath: '.build/data/components.json',
    overlaySheetName: 'components',
    iconsDir: 'data/icons/components',
    iconsUrlPrefix: 'components',
  },
  {
    slug: 'loot',
    label: 'Лут',
    parsedJsonPath: 'data/loot.json',
    overlayYamlPath: 'data/overrides/loot.yml',
    mergedJsonPath: '.build/data/loot.json',
    overlaySheetName: 'loot',
    iconsDir: 'data/icons/loot',
    iconsUrlPrefix: 'loot',
  },
  {
    slug: 'skills',
    label: 'Навыки',
    parsedJsonPath: 'data/skills.json',
    overlayYamlPath: 'data/overrides/skills.yml',
    mergedJsonPath: '.build/data/skills.json',
    overlaySheetName: 'skills',
    iconsDir: 'data/icons/skills',
    iconsUrlPrefix: 'skills',
  },
];

export function findCatalog(slug: string): CatalogConfig {
  const cfg = CATALOGS.find((c) => c.slug === slug);
  if (!cfg) throw new Error(`каталог не найден в CATALOGS: ${slug}`);
  return cfg;
}
