import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

const noRelativeParentImports = [
  'error',
  {
    patterns: [
      {
        group: ['../*'],
        message:
          'Импорты, поднимающиеся на 1+ уровня вверх, запрещены. Используй alias: @/ → src/, @build/ → .build/, @raw/ → assets/raw/, @img/ → assets/images/.',
      },
    ],
  },
];

export default tseslint.config(
  {
    ignores: [
      '.build/**',
      '**/dist/**',
      'data/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/src-tauri/target/**',
      '**/generated/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ...react.configs.flat.recommended,
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  react.configs.flat['jsx-runtime'],
  reactHooks.configs.flat['recommended-latest'],
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'react/prop-types': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'no-restricted-imports': noRelativeParentImports,
    },
  },
  {
    // scripts/** и apps/cop/** не имеют alias-инфраструктуры (@/ и т.п.):
    // локальные относительные импорты `../` там штатны.
    files: ['scripts/**/*', 'apps/cop/**/*'],
    rules: {
      'no-restricted-imports': 'off',
    },
  }
);
