import { promises as fs } from 'node:fs';
import path from 'node:path';
import { load as yamlLoad } from 'js-yaml';
import { CATALOGS, type CatalogConfig } from '../catalogs.config.js';

interface EntryMeta {
  overlayFields: string[];
  overlayUpdatedAt?: string;
  overlaySource?: string;
}

type Jsonish = Record<string, unknown>;

async function main() {
  // Первый проход: собираем keyIndex по всем parsed JSON'ам, чтобы на
  // втором проходе резолвить catalog для nested ссылок (blueprints.
  // ingredients / producesCatalog, transformsFrom.ingredients).
  const keyIndex = new Map<string, Set<string>>();
  const parsedBySlug = new Map<string, Jsonish[]>();
  for (const cfg of CATALOGS) {
    const parsed = (await loadParsed(cfg.parsedJsonPath)) ?? [];
    parsedBySlug.set(cfg.slug, parsed);
    for (const entry of parsed) {
      const k = String(entry.key);
      if (!keyIndex.has(k)) keyIndex.set(k, new Set());
      keyIndex.get(k)!.add(cfg.slug);
    }
  }

  for (const cfg of CATALOGS) {
    await mergeCatalog(cfg, parsedBySlug.get(cfg.slug) ?? [], keyIndex);
  }
}

async function mergeCatalog(
  cfg: CatalogConfig,
  parsed: Jsonish[],
  keyIndex: Map<string, Set<string>>
): Promise<void> {
  const overrides = await loadOverrides(cfg.overlayYamlPath);

  if (parsed.length === 0 && Object.keys(overrides).length === 0) {
    console.log(`⋯ ${cfg.slug}: ни parsed-JSON, ни overlay — пропускаем`);
    return;
  }

  const merged: Jsonish[] = parsed.map((entry) => {
    const key = String(entry.key);
    return mergeEntry(entry, overrides[key], cfg.overlaySheetName);
  });

  // Записи, существующие только в overlay (нет в parsed) — добавляем как новые
  // сущности. Так через Google Sheets можно ввести полностью новое оружие/меха
  // без обновления парсера или ручной правки JSON.
  const parsedKeys = new Set(parsed.map((entry) => String(entry.key)));
  let overlayOnlyCount = 0;
  for (const [key, override] of Object.entries(overrides)) {
    if (parsedKeys.has(key)) continue;
    const entry = mergeEntry({ key }, override, cfg.overlaySheetName);
    if (entry._meta) overlayOnlyCount++;
    merged.push(entry);
  }

  resolveCrossCatalogRefs(cfg.slug, merged, keyIndex);

  await fs.mkdir(path.dirname(cfg.mergedJsonPath), { recursive: true });
  await fs.writeFile(cfg.mergedJsonPath, JSON.stringify(merged, null, 2) + '\n', 'utf-8');

  const overriddenCount = merged.filter((r) => r._meta).length;
  console.log(
    `✓ ${cfg.slug}: merged ${merged.length} entries (${overriddenCount} with overlay${
      overlayOnlyCount > 0 ? `, ${overlayOnlyCount} overlay-only` : ''
    }) → ${cfg.mergedJsonPath}`
  );
}

async function loadParsed(pathToJson: string): Promise<Jsonish[] | null> {
  try {
    const raw = await fs.readFile(pathToJson, 'utf-8');
    return JSON.parse(raw) as Jsonish[];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}

async function loadOverrides(pathToYaml: string): Promise<Record<string, Jsonish>> {
  try {
    const raw = await fs.readFile(pathToYaml, 'utf-8');
    const parsed = (yamlLoad(raw) as Record<string, Jsonish>) || {};
    return parsed;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return {};
    throw err;
  }
}

function mergeEntry(base: Jsonish, override: Jsonish | undefined, overlaySheet: string): Jsonish {
  if (!override) return base;

  const overrideCopy = { ...override };
  const updatedAt = overrideCopy._updatedAt as string | undefined;
  const sourceRow = overrideCopy._sourceRow as number | undefined;
  delete overrideCopy._updatedAt;
  delete overrideCopy._sourceRow;

  const overlayFields = collectPaths(overrideCopy);
  if (overlayFields.length === 0) return base;

  const merged = deepMerge(base, overrideCopy);
  const meta: EntryMeta = {
    overlayFields,
    overlayUpdatedAt: updatedAt,
    overlaySource:
      sourceRow != null
        ? `google-sheets:${overlaySheet}!row-${sourceRow}`
        : `google-sheets:${overlaySheet}`,
  };
  merged._meta = meta;
  return merged;
}

function deepMerge(target: Jsonish, source: Jsonish): Jsonish {
  const out: Jsonish = { ...target };
  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = out[key];
    if (isPlainObject(sourceVal) && isPlainObject(targetVal)) {
      out[key] = deepMerge(targetVal, sourceVal);
    } else {
      out[key] = sourceVal;
    }
  }
  return out;
}

function isPlainObject(v: unknown): v is Jsonish {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Резолвит поле `catalog` у cross-catalog ссылок по key, если оно не
 * задано ни парсером, ни overlay: blueprints.ingredients + producesCatalog;
 * weapons/equipment.transformsFrom.ingredients. Ambiguity (один key в
 * нескольких parsed JSON'ах) → warning + первый по алфавиту.
 */
function resolveCrossCatalogRefs(
  slug: string,
  entries: Jsonish[],
  keyIndex: Map<string, Set<string>>
): void {
  if (slug === 'blueprints') {
    for (const bp of entries) {
      if (typeof bp.producesKey === 'string' && !bp.producesCatalog) {
        const c = pickCatalog(String(bp.producesKey), keyIndex, slug, bp.key);
        if (c) bp.producesCatalog = c;
      }
      resolveIngredientCatalogs(bp.ingredients, keyIndex, slug, bp.key);
    }
  } else if (slug === 'weapons' || slug === 'equipment') {
    for (const e of entries) {
      const tf = e.transformsFrom;
      if (isPlainObject(tf)) {
        resolveIngredientCatalogs(tf.ingredients, keyIndex, slug, e.key);
      }
    }
  }
}

function resolveIngredientCatalogs(
  ings: unknown,
  keyIndex: Map<string, Set<string>>,
  slug: string,
  ownerKey: unknown
): void {
  if (!Array.isArray(ings)) return;
  for (const ing of ings) {
    if (!isPlainObject(ing)) continue;
    if (ing.catalog || typeof ing.key !== 'string') continue;
    const c = pickCatalog(ing.key, keyIndex, slug, ownerKey);
    if (c) ing.catalog = c;
  }
}

function pickCatalog(
  key: string,
  keyIndex: Map<string, Set<string>>,
  ownerSlug: string,
  ownerKey: unknown
): string | undefined {
  const set = keyIndex.get(key);
  if (!set || set.size === 0) {
    console.warn(
      `  ⚠ ${ownerSlug}/${String(ownerKey)}: key '${key}' не найден ни в одном каталоге`
    );
    return undefined;
  }
  if (set.size > 1) {
    const list = [...set].sort();
    console.warn(
      `  ⚠ ${ownerSlug}/${String(ownerKey)}: key '${key}' есть в [${list.join(
        ', '
      )}] — беру ${list[0]} (переопредели через overlay)`
    );
    return list[0];
  }
  return [...set][0];
}

/**
 * Собирает пути полей overlay-записи (без служебных `_*`).
 * Пример: { buyPrice: { bonds: 200 }, weight: 12 } → ["buyPrice.bonds", "weight"]
 */
function collectPaths(obj: Jsonish, prefix = ''): string[] {
  const paths: string[] = [];
  for (const key of Object.keys(obj)) {
    if (key.startsWith('_')) continue;
    const val = obj[key];
    const p = prefix ? `${prefix}.${key}` : key;
    if (isPlainObject(val)) {
      paths.push(...collectPaths(val, p));
    } else {
      paths.push(p);
    }
  }
  return paths;
}

main().catch((err) => {
  console.error('build:data failed:', err.message);
  process.exit(1);
});
