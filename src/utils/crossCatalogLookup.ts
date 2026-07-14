import weaponsData from '@build/data/weapons.json';
import equipmentData from '@build/data/equipment.json';
import componentsData from '@build/data/components.json';
import itemsData from '@build/data/items.json';
import oreData from '@build/data/ore.json';
import lootData from '@build/data/loot.json';
import ammoData from '@build/data/ammo.json';
import robotsData from '@build/data/robots.json';
import blueprintsData from '@build/data/blueprints.json';

/**
 * Единый lookup имени сущности по (catalog, key) для UI-компонентов,
 * которые показывают ссылки между каталогами (напр. blueprints:
 * producesKey/producesCatalog и ingredients[].{key,catalog}).
 *
 * Собирается один раз при первом обращении — тянет уже подгруженные
 * @build/data/*.json (те же импорты, что у сторов, дедуп на уровне
 * bundler'а).
 */

interface CatalogEntry {
  key: string;
  name?: string;
  iconPath?: string;
  /** Только для equipment — используется для роутинга в нужный подкаталог. */
  subtype?: string;
}

const CATALOG_SOURCES: Record<string, CatalogEntry[]> = {
  weapons: weaponsData as CatalogEntry[],
  equipment: equipmentData as CatalogEntry[],
  components: componentsData as CatalogEntry[],
  items: itemsData as CatalogEntry[],
  ore: oreData as CatalogEntry[],
  loot: lootData as CatalogEntry[],
  ammo: ammoData as CatalogEntry[],
  robots: robotsData as CatalogEntry[],
  blueprints: blueprintsData as CatalogEntry[],
};

let cache: Map<string, CatalogEntry> | null = null;

function buildCache(): Map<string, CatalogEntry> {
  const map = new Map<string, CatalogEntry>();
  for (const [catalog, entries] of Object.entries(CATALOG_SOURCES)) {
    for (const e of entries) {
      map.set(`${catalog}:${e.key}`, e);
    }
  }
  return map;
}

function getEntry(catalog: string | undefined, key: string): CatalogEntry | undefined {
  if (!catalog) return undefined;
  if (!cache) cache = buildCache();
  return cache.get(`${catalog}:${key}`);
}

/**
 * Возвращает name сущности по (catalog, key), или undefined если
 * пара не найдена (unresolved cross-catalog ref — legitimate состояние,
 * напр. `robot_filin` из пака не совпадает с ключами в robots.json).
 */
export function lookupName(catalog: string | undefined, key: string): string | undefined {
  return getEntry(catalog, key)?.name;
}

/**
 * Возвращает iconPath сущности из указанного каталога — для рендера
 * мини-карточек ингредиентов. undefined = не найдено или без иконки.
 */
export function lookupIconPath(catalog: string | undefined, key: string): string | undefined {
  return getEntry(catalog, key)?.iconPath;
}

/**
 * Возвращает subtype (только для equipment) — используется в
 * `catalogPathFor` для маршрутизации ссылки в нужный UI-подкаталог
 * (chips/shields/armour/…). У остальных каталогов не используется.
 */
export function lookupSubtype(catalog: string | undefined, key: string): string | undefined {
  return getEntry(catalog, key)?.subtype;
}

let blueprintNameCache: Map<string, string> | null = null;

function buildBlueprintNameCache(): Map<string, string> {
  const map = new Map<string, string>();
  for (const bp of blueprintsData as CatalogEntry[]) {
    if (bp.name) map.set(bp.name.trim().toLowerCase(), bp.key);
  }
  return map;
}

/**
 * Резолвит key чертежа по его отображаемому имени. Нужно, чтобы поля
 * `craftFromBlueprints: string[]` (name[]) в оружии/оборудовании/
 * компонентах и т.д. рендерились кликабельными ссылками на blueprints-
 * catalog. Поиск case-insensitive с trim'ом.
 */
export function lookupBlueprintKeyByName(name: string): string | undefined {
  if (!name) return undefined;
  if (!blueprintNameCache) blueprintNameCache = buildBlueprintNameCache();
  return blueprintNameCache.get(name.trim().toLowerCase());
}
