import type { QueueItem, Resolver } from '../lib/bfs.js';

const WIKI_BASE = 'https://new.mechs.su';

export type SkillKind = 'skill' | 'ability';

export interface Skill {
  key: string;
  name: string;
  kind: SkillKind;
  description: string;
  affects: string[];
  perStatPercent?: number;
  iconPath?: string;
  wikiUrl?: string;
}

/**
 * Захардкоженный список 12 навыков и умений. Разметка вики (2902/2905)
 * плоская, без h2.wiki-header/wiki-item-table — стандартный автопарсер
 * не применим. Ключи стабильны, описания взяты из вики и служат
 * fallback-значениями (при желании автор перезаписывает через overlay).
 *
 * Строгое соответствие с типом `Skill` из `src/types/skill.ts` — при
 * изменении набора / имён проверяй оба места.
 */
interface SkillEntry {
  key: string;
  name: string;
  kind: SkillKind;
  description: string;
  affects: string[];
  /** Только для ability — прирост на 1 стат в процентах (из 2905). */
  perStatPercent?: number;
  /** Для fallback-парсинга perStatPercent из HTML — искомое ключевое слово в блоке 2905. */
  perStatSearch?: string;
}

const SKILL_ENTRIES: SkillEntry[] = [
  // 2902 — навыки. Описания сокращены до сути.
  {
    key: 'weapon-mastery',
    name: 'Владение оружием',
    kind: 'skill',
    description:
      'Опыт владения оружием — растёт от уничтожения монстров/кротов. Выше 100 каждый уровень добавляет +1 стат к удару этим видом орудий.',
    affects: ['weaponDamage'],
  },
  {
    key: 'sniper',
    name: 'Снайпер',
    kind: 'skill',
    description:
      'Растёт от количества сделанных выстрелов. Уменьшает шанс промаха и увеличивает шанс критического урона. Важна для бойца.',
    affects: ['missChance', 'critChance'],
  },
  {
    key: 'mining',
    name: 'Добыча',
    kind: 'skill',
    description:
      'Растёт от количества добытых ресурсов. Увеличивает скорость добычи. Важна для персонажа-добытчика.',
    affects: ['miningSpeed'],
  },
  {
    key: 'specialist',
    name: 'Специалист',
    kind: 'skill',
    description:
      'Растёт от количества выстрелов из ремонтных пушек по поврежденным роботам своей нации. Увеличивает мощность ремонтника. Не растёт при лечении серых турелей, энергоблоков и криминальных игроков.',
    affects: ['repairPower'],
  },
  {
    key: 'trade',
    name: 'Торговля',
    kind: 'skill',
    description:
      'Растёт от продажи вещей и ресурсов в магазин. Увеличивает процент цены при продаже в магазин. Важен для торговца.',
    affects: ['sellPrice'],
  },
  // 2905 — умения. Проценты на 1 стат — из блока «Каждый стат умений, навыков прибавляет в процентах».
  {
    key: 'ability-armor',
    name: 'Броня',
    kind: 'ability',
    description: 'Умение «Броня». Каждый стат прибавляет процент к броне робота.',
    affects: ['armor'],
    perStatPercent: 1.5,
    perStatSearch: 'Броня',
  },
  {
    key: 'ability-fields',
    name: 'Поля',
    kind: 'ability',
    description: 'Умение «Поля». Каждый стат прибавляет процент к энергетическим полям робота.',
    affects: ['fields'],
    perStatPercent: 1.5,
    perStatSearch: 'Поля',
  },
  {
    key: 'ability-capacity',
    name: 'Вместимость',
    kind: 'ability',
    description: 'Умение «Вместимость». Каждый стат прибавляет процент к вместимости трюма.',
    affects: ['capacity'],
    perStatPercent: 1.5,
    perStatSearch: 'Вместимость',
  },
  {
    key: 'ability-reactor-power',
    name: 'Мощность реакторов',
    kind: 'ability',
    description:
      'Умение «Мощность реакторов». Каждый стат прибавляет процент к мощности реакторов.',
    affects: ['reactorPower'],
    perStatPercent: 0.75,
    perStatSearch: 'Мощность реакторов',
  },
  {
    key: 'ability-accumulator-capacity',
    name: 'Емкость накопителей',
    kind: 'ability',
    description:
      'Умение «Емкость накопителей». Каждый стат прибавляет процент к емкости накопителей.',
    affects: ['accumulatorCapacity'],
    perStatPercent: 1.5,
    perStatSearch: 'Емкость накопителей',
  },
  {
    key: 'ability-all-weapons',
    name: 'Все виды орудий',
    kind: 'ability',
    description: 'Умение «Все виды орудий». Каждый стат прибавляет процент ко всем видам орудий.',
    affects: ['allWeapons'],
    perStatPercent: 1.5,
    perStatSearch: 'Все виды орудий',
  },
  {
    key: 'ability-specialist-boost',
    name: 'Навык Специалиста',
    kind: 'ability',
    description: 'Умение «Навык Специалиста». Каждый стат прибавляет процент к навыку Специалиста.',
    affects: ['specialistSkill'],
    perStatPercent: 1.5,
    perStatSearch: 'Навык Специалиста',
  },
];

const SKILL_PAGE_ID = 2902;
const ABILITY_PAGE_ID = 2905;

export interface SkillCtx {
  page: 'skill' | 'ability';
}

/**
 * Каталог skills — полу-ручной. Стандартный `parsePage` не применим:
 * страницы 2902/2905 не содержат h2.wiki-header / wiki-item-table.
 *
 * Стратегия: BFS вызывает `parsePage` дважды (по seed'ам 2902 и 2905),
 * но результаты у нас статичны из SKILL_ENTRIES. Из HTML пытаемся
 * подтвердить/уточнить `perStatPercent` для ability регексом
 * `Название X.Y%`; description оставляем захардкоженным, потому что
 * фолдить полный текст вики регексами хрупко.
 *
 * Проставляем `wikiUrl` и (пустой) `iconPath` — иконок на вики у навыков
 * нет; при необходимости автор кладёт свои через overlay.
 */
export const skillsResolver: Resolver<Skill, SkillCtx> = {
  parsePage({ $, url, ctx }): Skill[] {
    if (ctx.page === 'skill') {
      // Возвращаем захардкоженные навыки, приписывая им URL.
      return SKILL_ENTRIES.filter((e) => e.kind === 'skill').map((e) => toSkill(e, url));
    }

    // ability: пытаемся уточнить perStatPercent из HTML.
    // Блок вида «Броня 1.5% Поля 1.5% Вместимость 1.5% ...» — регекс на
    // каждое известное имя из SKILL_ENTRIES.
    const bodyText = $('article').text().replace(/\s+/g, ' ').trim();

    return SKILL_ENTRIES.filter((e) => e.kind === 'ability').map((e) => {
      const skill = toSkill(e, url);
      if (e.perStatSearch) {
        const parsed = extractPercent(bodyText, e.perStatSearch);
        if (parsed != null) skill.perStatPercent = parsed;
      }
      return skill;
    });
  },

  extractLinks(): QueueItem<SkillCtx>[] {
    // Все данные — на seed-страницах, дочерних не тянем.
    return [];
  },

  /**
   * Post-BFS: гарантируем что все 12 записей есть в parsed JSON, даже
   * если fetch страницы 2902 или 2905 упал (404, редирект, сеть). Для
   * недостающих ключей добавляем fallback из `SKILL_ENTRIES` (без
   * `wikiUrl`, потому что не смогли подтвердить URL).
   */
  hydrate(entries): Skill[] {
    const seen = new Set(entries.map((e) => e.key));
    const filled = [...entries];
    for (const e of SKILL_ENTRIES) {
      if (seen.has(e.key)) continue;
      filled.push(toSkill(e, ''));
    }
    return filled;
  },
};

export function skillsSeeds(): QueueItem<SkillCtx>[] {
  return [
    { url: `${WIKI_BASE}/?page_id=${SKILL_PAGE_ID}`, ctx: { page: 'skill' } },
    { url: `${WIKI_BASE}/?page_id=${ABILITY_PAGE_ID}`, ctx: { page: 'ability' } },
  ];
}

function toSkill(entry: SkillEntry, wikiUrl: string): Skill {
  const skill: Skill = {
    key: entry.key,
    name: entry.name,
    kind: entry.kind,
    description: entry.description,
    affects: entry.affects,
    wikiUrl,
  };
  if (entry.perStatPercent != null) skill.perStatPercent = entry.perStatPercent;
  return skill;
}

/**
 * Ищет `«Название X.Y%»` в тексте, возвращает число или null.
 * Использует границы слов / whitespace вокруг названия, чтобы «Броня»
 * не совпала внутри «Мощность броневой…» (в текущей вики такого нет,
 * но защита не мешает).
 */
function extractPercent(text: string, label: string): number | null {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?:^|\\s)${escaped}\\s+(\\d+(?:[.,]\\d+)?)%`);
  const m = re.exec(text);
  if (!m) return null;
  return Number(m[1].replace(',', '.'));
}
