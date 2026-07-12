/**
 * Разовый maintenance-скрипт: приводит колонки листа `mechs` в
 * Google Sheets к канону — набор колонок и их описания в Row 2.
 * Существующие данные в Row 3+ не трогает. Работает идемпотентно:
 * запускать сколько угодно раз.
 *
 * Использование:
 *   npm run setup:sheets  (нужно вручную добавить в package.json)
 *   или напрямую: tsx scripts/setup-sheets-columns/index.ts
 */

import { config as dotenvConfig } from 'dotenv';
import { google } from 'googleapis';

dotenvConfig({ path: '.env.local' });

const SPREADSHEET_ID = process.env.MECHS_OVERLAY_SPREADSHEET_ID;
const SA_KEY_PATH = process.env.GSHEETS_SA_KEY_PATH;
const SHEET_NAME = 'mechs';

interface ColumnSpec {
  name: string;
  description: string;
}

const CANONICAL_COLUMNS: ColumnSpec[] = [
  { name: 'key', description: 'Ключ меха (garpiy_1, kazuar…). Копируется из детали в UI' },
  { name: 'name', description: 'Полное название с уровнем' },
  { name: 'model', description: 'Модель без уровня' },
  { name: 'type', description: 'Тип: боец / транспортник / добытчик / разведчик' },
  { name: 'requiredLevel', description: 'Требуемый уровень персонажа' },
  { name: 'stats.durability', description: 'Прочность (HP)' },
  { name: 'stats.capacity', description: 'Вместимость трюма' },
  { name: 'stats.maxCapacity', description: 'Макс. вместимость под грузом (для транспортников)' },
  { name: 'stats.speed', description: 'Скорость' },
  { name: 'stats.maxSpeed', description: 'Скорость после макс. прокачки' },
  { name: 'stats.armor', description: 'Броня' },
  { name: 'stats.energyFields', description: 'Энергетические поля' },
  { name: 'stats.regenerationPerMinute', description: 'Восстановление прочности в минуту' },
  { name: 'stats.additionalInvulnerability', description: 'Добавочная неуязвимость (секунды)' },
  { name: 'stats.additionalAcceleration', description: 'Добавочное ускорение (секунды)' },
  { name: 'buyPrice.bonds', description: 'Цена покупки в бонах' },
  { name: 'buyPrice.regls', description: 'Цена покупки в реглах' },
  { name: 'sellPrice.bonds', description: 'Цена продажи в бонах (базовая, без навыка «Торговля»)' },
  { name: 'sellPrice.regls', description: 'Цена продажи в реглах' },
  { name: 'upgradePrice.bonds', description: 'Цена прокачки в бонах' },
  { name: 'upgradePrice.regls', description: 'Цена прокачки в реглах' },
  { name: 'upgradeReglPercent', description: '% реглов от общей цены прокачки' },
  { name: 'itemUpgradePercent', description: '% прокачки предметов' },
  { name: 'extraSlots', description: 'Доп. слоты меха — список через ; (например «оружие; двигатель»)' },
  { name: 'features', description: 'Особенности — список через ; (например «Рывок охотника; Ускорение»)' },
  { name: 'backSideDamage', description: 'Урон в спину/бок в %' },
  { name: 'howitzerDamage', description: 'Урон от гаубиц в %' },
  { name: 'missChance', description: 'Вероятность промаха в %' },
  { name: 'description', description: 'Свободное описание меха' },
  { name: 'imageUrl', description: 'URL иллюстрации меха (если отличается от wiki)' },
  { name: 'wikiUrl', description: 'URL детальной страницы вики' },
  { name: 'iconPath', description: 'Путь к иконке (например data/icons/mechs/…)' },
  { name: 'source_note', description: 'Комментарий редактора (не идёт в JSON)' },
];

async function main() {
  if (!SPREADSHEET_ID) throw new Error('MECHS_OVERLAY_SPREADSHEET_ID не задан');
  if (!SA_KEY_PATH) throw new Error('GSHEETS_SA_KEY_PATH не задан');

  const auth = new google.auth.GoogleAuth({
    keyFile: SA_KEY_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  const currentRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!1:2`,
  });
  const existingHeaders = ((currentRes.data.values?.[0] as string[]) ?? []).map(String);
  const existingDescriptions = ((currentRes.data.values?.[1] as string[]) ?? []).map(String);

  console.log(`existing headers (${existingHeaders.length}):`, existingHeaders);

  const finalHeaders = [...existingHeaders];
  const finalDescriptions: string[] = [];
  for (let i = 0; i < finalHeaders.length; i++) {
    finalDescriptions.push(existingDescriptions[i] ?? '');
  }

  const added: string[] = [];
  for (const col of CANONICAL_COLUMNS) {
    if (!finalHeaders.includes(col.name)) {
      finalHeaders.push(col.name);
      finalDescriptions.push(col.description);
      added.push(col.name);
    }
  }

  // Заполнить/перезаписать описания для колонок, для которых мы знаем канон.
  for (let i = 0; i < finalHeaders.length; i++) {
    const spec = CANONICAL_COLUMNS.find((c) => c.name === finalHeaders[i]);
    if (spec) finalDescriptions[i] = spec.description;
  }

  const lastCol = columnLetter(finalHeaders.length);
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:${lastCol}2`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [finalHeaders, finalDescriptions],
    },
  });

  console.log(`\n✓ обновлено: ${finalHeaders.length} колонок`);
  if (added.length > 0) {
    console.log(`  добавлено: ${added.join(', ')}`);
  } else {
    console.log('  все канонические колонки уже были на месте');
  }
}

function columnLetter(n: number): string {
  let s = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

main().catch((err) => {
  console.error('setup:sheets failed:', err.message);
  process.exit(1);
});
