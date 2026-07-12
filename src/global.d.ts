/**
 * Runtime-переменная rspack/webpack, содержит output.publicPath из конфига.
 * В dev = '/', в prod = '/mechs-assistant/' (см. rspack.config.js).
 */
declare const __webpack_public_path__: string;

declare module '*.module.css' {
  const styles: Readonly<Record<string, string>>;
  export default styles;
}
