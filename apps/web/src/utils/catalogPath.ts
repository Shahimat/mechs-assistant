import { lookupSubtype } from './crossCatalogLookup';

/**
 * Слаги подкаталогов оборудования (7 UI-каталогов над единым
 * data--equipment-catalog). Совпадают с `path` в `router.tsx` →
 * `EQUIPMENT_ROUTES` и с `subtype=` в SubCatalog-обёртках.
 */
const EQUIPMENT_SUBTYPE_TO_ROUTE: Record<string, string> = {
  computer: 'chips-catalog',
  shield: 'shields-catalog',
  armour: 'armour-catalog',
  accumulator: 'accumulators-catalog',
  generator: 'reactors-catalog',
  extractor: 'drills-catalog',
  cargo: 'cargos-catalog',
};

const BASE = '/catalogs';

/**
 * Строит URL-ссылку на detail сущности в другом каталоге.
 * Роут открывает соответствующий Detail-Dialog через `?open=<key>`
 * (см. useDeepLinkOpen).
 *
 * Возвращает undefined, если каталог неизвестен или это equipment без
 * найденного subtype (без него неясно, в какой из 7 подкаталогов вести).
 */
export function catalogPathFor(catalog: string | undefined, key: string): string | undefined {
  if (!catalog) return undefined;

  const search = `?open=${encodeURIComponent(key)}`;

  switch (catalog) {
    case 'weapons':
      return `${BASE}/weapons-catalog${search}`;
    case 'ammo':
      return `${BASE}/ammo-catalog${search}`;
    case 'items':
      return `${BASE}/items-catalog${search}`;
    case 'ore':
      return `${BASE}/ore-catalog${search}`;
    case 'components':
      return `${BASE}/components-catalog${search}`;
    case 'loot':
      return `${BASE}/loot-catalog${search}`;
    case 'skills':
      return `${BASE}/skills-catalog${search}`;
    case 'robots':
      return `${BASE}/mechs-catalog${search}`;
    case 'blueprints':
      return `${BASE}/blueprints-catalog${search}`;
    case 'equipment': {
      const sub = lookupSubtype('equipment', key);
      const route = sub ? EQUIPMENT_SUBTYPE_TO_ROUTE[sub] : undefined;
      return route ? `${BASE}/${route}${search}` : undefined;
    }
    default:
      return undefined;
  }
}
