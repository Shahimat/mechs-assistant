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
];

export function findCatalog(slug: string): CatalogConfig {
  const cfg = CATALOGS.find((c) => c.slug === slug);
  if (!cfg) throw new Error(`каталог не найден в CATALOGS: ${slug}`);
  return cfg;
}
