/**
 * Конфиг парсера вики.
 * `page_id` — id раздела new.mechs.su/?page_id=<id>.
 * `type` — значение поля Robot.type (для мехов).
 *
 * Пилот MVP1: только мехи, четыре класса. При расширении на другие
 * каталоги — добавлять конфиг через одноимённый экспорт.
 */

export type MechClassPage = {
  page_id: number;
  type: 'боец' | 'транспортник' | 'добытчик' | 'разведчик';
};

export const MECH_CLASS_PAGES: MechClassPage[] = [
  { page_id: 3301, type: 'боец' },
  { page_id: 3088, type: 'транспортник' },
  { page_id: 3099, type: 'добытчик' },
  { page_id: 3102, type: 'разведчик' },
];

export const WIKI_BASE = 'https://new.mechs.su';
export const ROBOTS_JSON_PATH = 'data/robots.json';
export const ICONS_DIR = 'data/icons/mechs';
export const ICONS_URL_PREFIX = 'mechs';
export const FETCH_DELAY_MS = 150; // вежливость к серверу
