/**
 * Внешние ссылки, используемые в UI. URL публичных листов Google Sheets
 * собираются из ID таблицы (env `MECHS_OVERLAY_SPREADSHEET_ID`,
 * инжектируется rspack DefinePlugin) + фиксированный GID листа. Так ID
 * не хранится в git — только в `.env.local` (см. `.env.local.example`).
 *
 * Пустая строка = переменная не задана в env → UI должен gracefully
 * скрыть/отключить соответствующий элемент.
 */

const OVERLAY_SHEET_ID = process.env.MECHS_OVERLAY_SPREADSHEET_ID ?? '';

/**
 * Позиционный GID листа `todo` в overlay-spreadsheet — фиксированная
 * константа проекта. Если лист будет пересоздан, `npm run setup:todo`
 * распечатает новый gid для обновления.
 */
const TODO_SHEET_GID = '1984581571';

function buildSheetUrl(spreadsheetId: string, gid: string): string {
  if (!spreadsheetId) return '';
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?gid=${gid}#gid=${gid}`;
}

/** Публичный URL листа `todo` (планы разработки). Пусто если env не задан. */
export const TODO_SHEET_URL: string = buildSheetUrl(OVERLAY_SHEET_ID, TODO_SHEET_GID);
