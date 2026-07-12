/**
 * Runtime-переменная rspack/webpack, содержит output.publicPath из конфига.
 * В dev = '/', в prod = '/mechs-assistant/' (см. rspack.config.js).
 */
declare const __webpack_public_path__: string;

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
