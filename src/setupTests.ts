import '@testing-library/jest-dom';

// __webpack_public_path__ инжектируется rspack в runtime; в jest его нет.
(globalThis as unknown as { __webpack_public_path__: string }).__webpack_public_path__ = '/';
