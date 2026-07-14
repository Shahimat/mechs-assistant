import { config as dotenvConfig } from 'dotenv';
import { google } from 'googleapis';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { dump as yamlDump } from 'js-yaml';
import { SHEETS_MAP, OVERRIDES_DIR } from './config.js';

dotenvConfig({ path: '.env.local' });

type OverrideEntry = Record<string, unknown>;
type Overrides = Record<string, OverrideEntry>;

const SPREADSHEET_ID = process.env.MECHS_OVERLAY_SPREADSHEET_ID;
const SA_KEY_PATH = process.env.GSHEETS_SA_KEY_PATH;
const SA_KEY_JSON = process.env.GSHEETS_SA_KEY;

async function main() {
  if (!SPREADSHEET_ID) {
    throw new Error('MECHS_OVERLAY_SPREADSHEET_ID не задан');
  }
  if (!SA_KEY_PATH && !SA_KEY_JSON) {
    throw new Error('GSHEETS_SA_KEY_PATH (локально) или GSHEETS_SA_KEY (CI) не заданы');
  }

  // Scope `spreadsheets` (не readonly) нужен для sync листа `todo` —
  // fallback-даты пишутся обратно в Sheets, чтобы редактор видел
  // проставленную дату в родной среде.
  const auth = new google.auth.GoogleAuth({
    keyFile: SA_KEY_PATH,
    credentials: SA_KEY_JSON && !SA_KEY_PATH ? JSON.parse(SA_KEY_JSON) : undefined,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  for (const [sheetName, catalogId] of Object.entries(SHEETS_MAP)) {
    console.log(`syncing sheet: ${sheetName} → ${catalogId}`);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      // A:AZ — до 52 колонок. Для мехов сейчас ~32, запас на будущее.
      // Range A:Z обрезал бы колонки после Z (description, extraSlots,
      // features, wikiUrl попадают в AA+).
      range: `${sheetName}!A:AZ`,
    });
    const rows = (res.data.values ?? []) as string[][];
    const overrides = parseRows(rows);
    const outPath = path.join(OVERRIDES_DIR, `${sheetName}.yml`);
    await writeOverrides(outPath, sheetName, overrides);
  }

  await syncTodoSheet(sheets);
}

const TODO_SHEET_NAME = 'todo';
const TODO_HEADERS = ['Дата', 'Приоритет', 'Статус', 'Задача', 'Заметка'];

interface TodoRow {
  key: string;
  createdAt: string;
  priority: string;
  status: string;
  text: string;
  note?: string;
}

/**
 * Синхронизирует лист `todo`. В отличие от каталогов:
 *   1. Без merge с parsed — Sheets единственный источник.
 *   2. Ключ генерится позиционно (`row-<N>`), т.к. у Todo нет натурального key.
 *   3. Пустое поле «Дата» → генерим `YYYY-MM-DD` и **пишем обратно в Sheets**
 *      (batch update колонки A), чтобы редактор видел дату в родной среде.
 */
async function syncTodoSheet(sheets: ReturnType<typeof google.sheets>): Promise<void> {
  console.log(`syncing sheet: ${TODO_SHEET_NAME} → data/overrides/todos.yml`);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${TODO_SHEET_NAME}!A:E`,
  });
  const rows = (res.data.values ?? []) as string[][];
  if (rows.length <= 2) {
    await writeTodos([]);
    console.log(`  → data/overrides/todos.yml (0 записей)`);
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const body = rows.slice(2);
  const todos: TodoRow[] = [];
  const dateWriteBacks: Array<{ row: number; value: string }> = [];

  body.forEach((row, idx) => {
    const priority = (row[1] ?? '').trim();
    const status = (row[2] ?? '').trim();
    const text = (row[3] ?? '').trim();
    if (!text) return;
    if (!priority || !status) {
      console.warn(`  ⚠ todo row ${idx + 3}: priority/status пустые, пропуск`);
      return;
    }

    let createdAt = (row[0] ?? '').trim();
    if (!createdAt) {
      createdAt = today;
      dateWriteBacks.push({ row: idx + 3, value: today });
    }

    const entry: TodoRow = {
      key: `row-${idx + 3}`,
      createdAt,
      priority,
      status,
      text,
    };
    const note = (row[4] ?? '').trim();
    if (note) entry.note = note;
    todos.push(entry);
  });

  if (dateWriteBacks.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'RAW',
        data: dateWriteBacks.map((w) => ({
          range: `${TODO_SHEET_NAME}!A${w.row}`,
          values: [[w.value]],
        })),
      },
    });
    console.log(`  ← ${dateWriteBacks.length} дат проставлено в Sheets`);
  }

  await writeTodos(todos);
  console.log(`  → data/overrides/todos.yml (${todos.length} записей)`);
}

async function writeTodos(todos: TodoRow[]): Promise<void> {
  const outPath = path.join(OVERRIDES_DIR, 'todos.yml');
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  const header =
    `# АВТО-СГЕНЕРИРОВАНО из Google Sheets (лист: ${TODO_SHEET_NAME})\n` +
    `# TODO разработки — правки в Sheets, не здесь.\n` +
    `# Дата ставится парсером автоматически, если ячейка пуста.\n\n`;
  const body = todos.length > 0 ? yamlDump(todos, { lineWidth: 100, noRefs: true }) : '[]\n';
  // TODO_HEADERS упоминается только для документации порядка — контракт
  // между setup-todo-sheet и sync (лист должен иметь именно эти 5 колонок
  // в этом порядке; иначе парсер прочтёт неправильные поля).
  void TODO_HEADERS;
  await fs.writeFile(outPath, header + body, 'utf-8');
}

function parseRows(rows: string[][]): Overrides {
  if (rows.length === 0) return {};
  // Row 1 — заголовки колонок, Row 2 — описания колонок для редакторов
  // (справочный текст, в JSON не идёт). Данные начинаются с Row 3.
  const [header, , ...body] = rows;
  const result: Overrides = {};
  const now = new Date().toISOString();

  body.forEach((row, idx) => {
    const key = row[0]?.trim();
    if (!key) return;

    const entry: OverrideEntry = {};
    let hasContent = false;

    for (let i = 1; i < header.length; i++) {
      const fieldName = header[i]?.trim();
      const rawValue = row[i]?.trim();
      if (!fieldName) continue;
      if (fieldName === 'source_note') continue;
      if (rawValue === undefined || rawValue === '') continue;

      setNestedField(entry, fieldName, parseValue(rawValue, fieldName));
      hasContent = true;
    }

    if (!hasContent) return;

    entry._sourceRow = idx + 3; // +1 header, +1 description row, +1 1-indexed
    entry._updatedAt = now;
    result[key] = entry;
  });

  return result;
}

/**
 * Поддержка dotted-path (`stats.durability` → { stats: { durability: … } }).
 */
function setNestedField(target: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let cursor = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const next = cursor[parts[i]];
    if (typeof next !== 'object' || next === null || Array.isArray(next)) {
      cursor[parts[i]] = {};
    }
    cursor = cursor[parts[i]] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]] = value;
}

/** Поля, которые в JSON всегда массивы — Sheets-ячейку сплитим по `;`. */
const ARRAY_FIELDS = new Set(['extraSlots', 'features']);

function parseValue(raw: string, fieldName?: string): unknown {
  if (fieldName && ARRAY_FIELDS.has(fieldName)) {
    return raw
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (/^-?\d+$/.test(raw)) return Number(raw);
  if (/^-?\d+\.\d+$/.test(raw)) return Number(raw);
  const lower = raw.toLowerCase();
  if (lower === 'true') return true;
  if (lower === 'false') return false;
  return raw;
}

async function writeOverrides(outPath: string, sheetName: string, data: Overrides): Promise<void> {
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  const header =
    `# АВТО-СГЕНЕРИРОВАНО из Google Sheets (лист: ${sheetName})\n` +
    `# Правки — в Sheets, следующий синк перезапишет этот файл.\n` +
    `# См. context/conventions/data-overlay.yml.\n\n`;
  const body =
    Object.keys(data).length > 0 ? yamlDump(data, { lineWidth: 100, noRefs: true }) : '{}\n';
  await fs.writeFile(outPath, header + body, 'utf-8');
  console.log(`  → ${outPath} (${Object.keys(data).length} записей)`);
}

main().catch((err) => {
  console.error('sync:sheets failed:', err.message);
  process.exit(1);
});
