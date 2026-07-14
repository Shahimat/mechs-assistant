/**
 * Runtime-переменная rspack/webpack, содержит output.publicPath из конфига.
 * В dev = '/', в prod = '/mechs-assistant/' (см. rspack.config.js).
 */
declare const __webpack_public_path__: string;

/**
 * Клиентские env-переменные, инжектируемые rspack DefinePlugin из
 * `.env.local`. Server-only переменные (SA-ключи и т.п.) сюда не
 * декларируем — они не инжектируются в клиент.
 */
declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * ID overlay-таблицы Google Sheets. Не секрет: доступ к таблице
     * контролируется Sheets sharing, ID виден в клиенте. Используется в
     * `src/config/links.ts` для сборки URL публичных листов (например,
     * листа `todo`). Пустая строка = переменная не задана в env.
     */
    MECHS_OVERLAY_SPREADSHEET_ID: string;
  }
}

declare module '*.module.css' {
  const styles: Readonly<Record<string, string>>;
  export default styles;
}

declare module '*.webp' {
  const url: string;
  export default url;
}

declare module '*.png' {
  const url: string;
  export default url;
}

declare module '*.jpg' {
  const url: string;
  export default url;
}

declare module '*.jpeg' {
  const url: string;
  export default url;
}

declare module '*.svg' {
  const url: string;
  export default url;
}

declare module '*.gif' {
  const url: string;
  export default url;
}
