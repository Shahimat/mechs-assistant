import type { OverlayMeta } from './common';

/** 2902 = skill (навык), 2905 = ability (умение). */
export type SkillKind = 'skill' | 'ability';

export interface Skill {
  key: string;
  name: string;
  kind: SkillKind;
  /**
   * Короткое разъяснение из вики. Захардкожено в `SKILL_ENTRIES` (полный
   * текст с вики), может быть переопределено через overlay.
   */
  description: string;
  /**
   * Семантические ключи полей других каталогов, на которые skill влияет.
   * Пока просто теги (`weaponDamage`, `sellPrice`, `armor`, …); runtime
   * логика применения — MVP2 через отдельную сущность
   * `data--skill-modifiers`.
   */
  affects: string[];
  /**
   * Прирост на 1 стат в процентах — только у ability (из 2905:
   * «Броня 1.5% Поля 1.5% …»). У skill (2902) — undefined.
   */
  perStatPercent?: number;
  iconPath?: string;
  wikiUrl?: string;
  _meta?: OverlayMeta;
}
