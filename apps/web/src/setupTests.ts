import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// jsdom не определяет TextEncoder/TextDecoder в global-скоупе, а react-router 7
// обращается к TextEncoder на этапе загрузки модуля — без полифилла падает
// весь suite с ReferenceError.
const g = globalThis as unknown as {
  TextEncoder?: typeof TextEncoder;
  TextDecoder?: typeof TextDecoder;
};
if (!g.TextEncoder) g.TextEncoder = TextEncoder;
if (!g.TextDecoder) g.TextDecoder = TextDecoder;

(globalThis as unknown as { __webpack_public_path__: string }).__webpack_public_path__ = '/';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
