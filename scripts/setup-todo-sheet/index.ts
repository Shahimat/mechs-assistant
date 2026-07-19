/**
 * Настройка листа `_todo` в overlay-spreadsheet: заголовки Row 1-2 +
 * dropdown validation на колонках «Приоритет» и «Статус». Row 3+ (данные)
 * не трогает. Идемпотентно — повторный запуск переписывает Row 1-2 и
 * validation до канона, юзерские записи ниже сохраняются.
 *
 * Использование:  npm run setup:todo
 *
 * Требует те же env, что и setup:sheets:
 *   MECHS_OVERLAY_SPREADSHEET_ID + GSHEETS_SA_KEY_PATH.
 */

import { config as dotenvConfig } from 'dotenv';
import { google } from 'googleapis';

dotenvConfig({ path: '.env.local' });

const SPREADSHEET_ID = process.env.MECHS_OVERLAY_SPREADSHEET_ID;
const SA_KEY_PATH = process.env.GSHEETS_SA_KEY_PATH;

const SHEET_NAME = 'todo';

const COLUMNS: Array<{ name: string; description: string; dropdown?: string[] }> = [
  {
    name: 'Дата',
    description: 'Проставляется автоматически парсером при синке (не редактировать)',
  },
  {
    name: 'Приоритет',
    description: 'Уровень срочности',
    dropdown: ['Блокер', 'Высокий', 'Средний', 'Низкий'],
  },
  {
    name: 'Статус',
    description: 'Стадия задачи',
    dropdown: ['Новая', 'В работе', 'Готово', 'Удален'],
  },
  {
    name: 'Задача',
    description: 'Суть — что нужно сделать',
  },
  {
    name: 'Заметка',
    description: 'Контекст/ссылки/детали (опционально)',
  },
];

// Диапазон валидации: строки 3-1000 достаточно для «человеческого»
// списка. Sheets позволяет расширить позже без переписывания правила.
const VALIDATION_ROW_START = 2; // 0-based, соответствует Row 3
const VALIDATION_ROW_END = 1000;

async function main(): Promise<void> {
  if (!SPREADSHEET_ID) throw new Error('MECHS_OVERLAY_SPREADSHEET_ID не задан');
  if (!SA_KEY_PATH) throw new Error('GSHEETS_SA_KEY_PATH не задан');

  const auth = new google.auth.GoogleAuth({
    keyFile: SA_KEY_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  const sheetId = await findSheetId(sheets, SHEET_NAME);
  if (sheetId == null) {
    throw new Error(
      `лист "${SHEET_NAME}" не найден в spreadsheet ${SPREADSHEET_ID}. ` +
        `Создай его вручную и перезапусти скрипт.`
    );
  }
  console.log(`▶ ${SHEET_NAME}: sheetId=${sheetId}`);

  await writeHeadersAndDescriptions(sheets);
  await applyDropdownValidations(sheets, sheetId);
  await protectDateColumn(sheets, sheetId);

  console.log(
    `✓ ${SHEET_NAME}: ${COLUMNS.length} колонок настроено, dropdown-валидации применены, колонка «Дата» защищена (warning-only)`
  );
}

async function findSheetId(
  sheets: ReturnType<typeof google.sheets>,
  sheetName: string
): Promise<number | null> {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheet = meta.data.sheets?.find((s) => s.properties?.title === sheetName);
  return sheet?.properties?.sheetId ?? null;
}

async function writeHeadersAndDescriptions(
  sheets: ReturnType<typeof google.sheets>
): Promise<void> {
  const headers = COLUMNS.map((c) => c.name);
  const descriptions = COLUMNS.map((c) => c.description);
  const lastCol = columnLetter(COLUMNS.length);
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:${lastCol}2`,
    valueInputOption: 'RAW',
    requestBody: { values: [headers, descriptions] },
  });
}

async function applyDropdownValidations(
  sheets: ReturnType<typeof google.sheets>,
  sheetId: number
): Promise<void> {
  const requests = COLUMNS.map((col, idx) => {
    if (!col.dropdown) return null;
    return {
      setDataValidation: {
        range: {
          sheetId,
          startRowIndex: VALIDATION_ROW_START,
          endRowIndex: VALIDATION_ROW_END,
          startColumnIndex: idx,
          endColumnIndex: idx + 1,
        },
        rule: {
          condition: {
            type: 'ONE_OF_LIST',
            values: col.dropdown.map((v) => ({ userEnteredValue: v })),
          },
          strict: true,
          showCustomUi: true,
        },
      },
    };
  }).filter((r): r is NonNullable<typeof r> => r != null);

  if (requests.length === 0) return;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { requests },
  });
}

/**
 * Помечает колонку «Дата» (индекс 0) как protected range с warningOnly.
 * Sheets покажет предупреждение при попытке ручного редактирования, но
 * не заблокирует жёстко — SA-бот и владелец продолжают писать без
 * дополнительных permissions. Идемпотентно: сначала удаляет прежние
 * защиты этой колонки (совпадающие по startColumnIndex), потом ставит
 * заново.
 */
async function protectDateColumn(
  sheets: ReturnType<typeof google.sheets>,
  sheetId: number
): Promise<void> {
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: 'sheets(properties(sheetId),protectedRanges(protectedRangeId,range))',
  });
  const sheet = meta.data.sheets?.find((s) => s.properties?.sheetId === sheetId);
  const stale = (sheet?.protectedRanges ?? []).filter(
    (pr) => pr.range?.startColumnIndex === 0 && pr.range?.endColumnIndex === 1
  );

  const requests: Array<Record<string, unknown>> = [];
  for (const pr of stale) {
    if (pr.protectedRangeId != null) {
      requests.push({ deleteProtectedRange: { protectedRangeId: pr.protectedRangeId } });
    }
  }
  requests.push({
    addProtectedRange: {
      protectedRange: {
        range: {
          sheetId,
          startRowIndex: VALIDATION_ROW_START,
          endRowIndex: VALIDATION_ROW_END,
          startColumnIndex: 0,
          endColumnIndex: 1,
        },
        description: 'Колонка «Дата» проставляется парсером — ручные правки перезаписываются',
        warningOnly: true,
      },
    },
  });

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { requests },
  });
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
  console.error('setup:todo failed:', err.message);
  process.exit(1);
});
