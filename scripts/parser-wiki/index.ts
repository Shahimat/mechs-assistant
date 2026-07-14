import { promises as fs } from 'node:fs';
import { findCatalog, type CatalogConfig } from '../catalogs.config.js';
import { runBfs, type Resolver, type QueueItem } from './lib/bfs.js';
import { downloadAndConvertIcons } from './lib/icons.js';
import { robotsResolver, robotsSeeds } from './resolvers/robots.js';
import { weaponsResolver, weaponsSeeds } from './resolvers/weapons.js';
import { equipmentResolver, equipmentSeeds } from './resolvers/equipment.js';
import { ammoResolver, ammoSeeds } from './resolvers/ammo.js';
import { itemsResolver, itemsSeeds } from './resolvers/items.js';
import { oreResolver, oreSeeds } from './resolvers/ore.js';
import { componentsResolver, componentsSeeds } from './resolvers/components.js';
import { lootResolver, lootSeeds } from './resolvers/loot.js';
import { skillsResolver, skillsSeeds } from './resolvers/skills.js';
import { blueprintsResolver, blueprintsSeeds } from './resolvers/blueprints.js';

const FETCH_DELAY_MS = 150; // вежливость к серверу

/**
 * Реестр резолверов по slug каталога. Резолвер = набор колбэков
 * (parsePage, extractLinks) + seed-URL. Добавляй сюда новый каталог,
 * когда его resolver написан.
 */
interface ResolverEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolver: Resolver<any, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  seeds: QueueItem<any>[];
}

const RESOLVERS: Record<string, () => ResolverEntry> = {
  robots: () => ({
    resolver: robotsResolver,
    seeds: robotsSeeds(),
  }),
  weapons: () => ({
    resolver: weaponsResolver,
    seeds: weaponsSeeds(),
  }),
  equipment: () => ({
    resolver: equipmentResolver,
    seeds: equipmentSeeds(),
  }),
  ammo: () => ({
    resolver: ammoResolver,
    seeds: ammoSeeds(),
  }),
  items: () => ({
    resolver: itemsResolver,
    seeds: itemsSeeds(),
  }),
  ore: () => ({
    resolver: oreResolver,
    seeds: oreSeeds(),
  }),
  components: () => ({
    resolver: componentsResolver,
    seeds: componentsSeeds(),
  }),
  loot: () => ({
    resolver: lootResolver,
    seeds: lootSeeds(),
  }),
  skills: () => ({
    resolver: skillsResolver,
    seeds: skillsSeeds(),
  }),
  blueprints: () => ({
    resolver: blueprintsResolver,
    seeds: blueprintsSeeds(),
  }),
};

async function main() {
  const args = process.argv.slice(2);
  const targetSlugs = args.length > 0 ? args : Object.keys(RESOLVERS);

  for (const slug of targetSlugs) {
    if (!RESOLVERS[slug]) {
      console.warn(`⋯ ${slug}: resolver не зарегистрирован — пропускаем`);
      continue;
    }
    const cfg = findCatalog(slug);
    await runCatalog(cfg, RESOLVERS[slug]());
  }
}

async function runCatalog(cfg: CatalogConfig, entry: ResolverEntry): Promise<void> {
  console.log(`▶ ${cfg.slug} (${cfg.label}): starting BFS from ${entry.seeds.length} seed(s)`);
  const items = (await runBfs(entry.seeds, entry.resolver, {
    fetchDelayMs: FETCH_DELAY_MS,
  })) as Array<{ key: string; iconPath?: string }>;

  await downloadAndConvertIcons(items, cfg.iconsDir, cfg.iconsUrlPrefix, {
    overlayBackground: cfg.iconBackgroundPath,
  });

  items.sort((a, b) => a.key.localeCompare(b.key));
  await fs.writeFile(cfg.parsedJsonPath, JSON.stringify(items, null, 2) + '\n', 'utf-8');
  console.log(`✓ ${cfg.slug}: wrote ${items.length} entries to ${cfg.parsedJsonPath}`);
}

main().catch((err) => {
  console.error('sync:wiki failed:', err.message);
  process.exit(1);
});
