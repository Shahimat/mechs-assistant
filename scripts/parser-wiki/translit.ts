/**
 * Простая транслитерация русского в латиницу для формирования `key`.
 * Соответствует формату существующих ключей в data/robots.json:
 *   `Гарпий` → `garpiy`, `Аэро Тягач 60` → `aero_tyagach_60`.
 */

const MAP: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'yo',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};

export function translit(input: string): string {
  const lower = input.toLowerCase();
  let out = '';
  for (const ch of lower) {
    if (MAP[ch] !== undefined) {
      out += MAP[ch];
    } else if (/[a-z0-9]/.test(ch)) {
      out += ch;
    } else if (/\s/.test(ch)) {
      out += '_';
    }
    // прочее — пропускаем
  }
  return out.replace(/_+/g, '_').replace(/^_|_$/g, '');
}
