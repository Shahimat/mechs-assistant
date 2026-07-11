import { promises as fs } from 'node:fs';
import path from 'node:path';
import { load as yamlLoad } from 'js-yaml';

const PARSED_JSON = 'data/robots.json';
const OVERRIDES_YAML = 'data/overrides/mechs.yml';
const OUTPUT_JSON = '.build/data/robots.json';
const OVERLAY_SHEET = 'mechs';

interface RobotMeta {
  overlayFields: string[];
  overlayUpdatedAt?: string;
  overlaySource?: string;
}

type Jsonish = Record<string, unknown>;

async function main() {
  const parsedRaw = await fs.readFile(PARSED_JSON, 'utf-8');
  const parsed = JSON.parse(parsedRaw) as Jsonish[];
  const overrides = await loadOverrides();
  const merged = parsed.map((robot) => {
    const key = String(robot.key);
    return mergeRobot(robot, overrides[key]);
  });

  await fs.mkdir(path.dirname(OUTPUT_JSON), { recursive: true });
  await fs.writeFile(OUTPUT_JSON, JSON.stringify(merged, null, 2) + '\n', 'utf-8');

  const overriddenCount = merged.filter((r) => r._meta).length;
  console.log(
    `✓ merged ${merged.length} robots (${overriddenCount} with overlay) → ${OUTPUT_JSON}`
  );
}

async function loadOverrides(): Promise<Record<string, Jsonish>> {
  try {
    const raw = await fs.readFile(OVERRIDES_YAML, 'utf-8');
    const parsed = (yamlLoad(raw) as Record<string, Jsonish>) || {};
    return parsed;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return {};
    throw err;
  }
}

function mergeRobot(base: Jsonish, override: Jsonish | undefined): Jsonish {
  if (!override) return base;

  const overrideCopy = { ...override };
  const updatedAt = overrideCopy._updatedAt as string | undefined;
  const sourceRow = overrideCopy._sourceRow as number | undefined;
  delete overrideCopy._updatedAt;
  delete overrideCopy._sourceRow;

  const overlayFields = collectPaths(overrideCopy);
  if (overlayFields.length === 0) return base;

  const merged = deepMerge(base, overrideCopy);
  const meta: RobotMeta = {
    overlayFields,
    overlayUpdatedAt: updatedAt,
    overlaySource:
      sourceRow != null
        ? `google-sheets:${OVERLAY_SHEET}!row-${sourceRow}`
        : `google-sheets:${OVERLAY_SHEET}`,
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
