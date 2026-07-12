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
    throw new Error(
      'GSHEETS_SA_KEY_PATH (локально) или GSHEETS_SA_KEY (CI) не заданы'
    );
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: SA_KEY_PATH,
    credentials: SA_KEY_JSON && !SA_KEY_PATH ? JSON.parse(SA_KEY_JSON) : undefined,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  for (const [sheetName, catalogId] of Object.entries(SHEETS_MAP)) {
    console.log(`syncing sheet: ${sheetName} → ${catalogId}`);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      // A:AZ — до 52 колонок. Для мехов сейчас ~33, запас на будущее.
      // Range A:Z обрезал бы колонки после Z (description, extraSlots,
      // features, imageUrl попадают в AA+).
      range: `${sheetName}!A:AZ`,
    });
    const rows = (res.data.values ?? []) as string[][];
    const overrides = parseRows(rows);
    const outPath = path.join(OVERRIDES_DIR, `${sheetName}.yml`);
    await writeOverrides(outPath, sheetName, overrides);
  }
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

async function writeOverrides(
  outPath: string,
  sheetName: string,
  data: Overrides
): Promise<void> {
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  const header =
    `# АВТО-СГЕНЕРИРОВАНО из Google Sheets (лист: ${sheetName})\n` +
    `# Правки — в Sheets, следующий синк перезапишет этот файл.\n` +
    `# См. context/conventions/data-overlay.yml.\n\n`;
  const body = Object.keys(data).length > 0
    ? yamlDump(data, { lineWidth: 100, noRefs: true })
    : '{}\n';
  await fs.writeFile(outPath, header + body, 'utf-8');
  console.log(`  → ${outPath} (${Object.keys(data).length} записей)`);
}

main().catch((err) => {
  console.error('sync:sheets failed:', err.message);
  process.exit(1);
});
