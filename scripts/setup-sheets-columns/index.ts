/**
 * Приводит колонки листов Google Sheets к канону — набор колонок и
 * описаний в Row 1-2. Существующие данные в Row 3+ не трогает.
 * Идемпотентно.
 *
 * Использование:
 *   npm run setup:sheets              — прогон по всем каталогам из
 *                                       CATALOGS, для которых есть
 *                                       колонки в COLUMNS_BY_SLUG.
 *   npm run setup:sheets weapons      — только weapons.
 *   npm run setup:sheets robots weapons — несколько по списку.
 */

import { config as dotenvConfig } from 'dotenv';
import { google } from 'googleapis';
import { CATALOGS, findCatalog } from '../catalogs.config.js';
import { COLUMNS_BY_SLUG, type ColumnSpec } from './columns.js';

dotenvConfig({ path: '.env.local' });

const SPREADSHEET_ID = process.env.MECHS_OVERLAY_SPREADSHEET_ID;
const SA_KEY_PATH = process.env.GSHEETS_SA_KEY_PATH;

async function main() {
  if (!SPREADSHEET_ID) throw new Error('MECHS_OVERLAY_SPREADSHEET_ID не задан');
  if (!SA_KEY_PATH) throw new Error('GSHEETS_SA_KEY_PATH не задан');

  const args = process.argv.slice(2);
  const targetSlugs =
    args.length > 0 ? args : CATALOGS.map((c) => c.slug).filter((slug) => COLUMNS_BY_SLUG[slug]);

  const auth = new google.auth.GoogleAuth({
    keyFile: SA_KEY_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  for (const slug of targetSlugs) {
    const columns = COLUMNS_BY_SLUG[slug];
    if (!columns) {
      console.warn(`⋯ ${slug}: колонки не описаны в COLUMNS_BY_SLUG — пропускаем`);
      continue;
    }
    const cfg = findCatalog(slug);
    await setupSheet(sheets, cfg.overlaySheetName, slug, columns);
  }
}

async function setupSheet(
  sheets: ReturnType<typeof google.sheets>,
  sheetName: string,
  slug: string,
  canonicalColumns: ColumnSpec[]
): Promise<void> {
  console.log(`▶ ${slug}: sheet=${sheetName}`);

  const currentRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!1:2`,
  });
  const existingHeaders = ((currentRes.data.values?.[0] as string[]) ?? []).map(String);
  const existingDescriptions = ((currentRes.data.values?.[1] as string[]) ?? []).map(String);

  console.log(`  existing headers (${existingHeaders.length}):`, existingHeaders);

  const finalHeaders = [...existingHeaders];
  const finalDescriptions: string[] = [];
  for (let i = 0; i < finalHeaders.length; i++) {
    finalDescriptions.push(existingDescriptions[i] ?? '');
  }

  const added: string[] = [];
  for (const col of canonicalColumns) {
    if (!finalHeaders.includes(col.name)) {
      finalHeaders.push(col.name);
      finalDescriptions.push(col.description);
      added.push(col.name);
    }
  }

  // Заполнить/перезаписать описания для колонок, для которых мы знаем канон.
  for (let i = 0; i < finalHeaders.length; i++) {
    const spec = canonicalColumns.find((c) => c.name === finalHeaders[i]);
    if (spec) finalDescriptions[i] = spec.description;
  }

  const lastCol = columnLetter(finalHeaders.length);
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1:${lastCol}2`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [finalHeaders, finalDescriptions],
    },
  });

  console.log(`  ✓ ${finalHeaders.length} колонок в ${sheetName}`);
  if (added.length > 0) {
    console.log(`    добавлено: ${added.join(', ')}`);
  } else {
    console.log('    все канонические колонки уже были на месте');
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
