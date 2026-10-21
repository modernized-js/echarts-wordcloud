import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
  { ignores: ['dist/', 'example/', 'node_modules/'] },
  js.configs.recommended,
  {
    files: ['index.js', 'src/**/*.js'],
    languageOptions: {
      sourceType: 'module',
      globals: globals.browser
    }
  },
  {
    files: ['vite.config.mjs'],
    languageOptions: {
      sourceType: 'module',
      globals: globals.node
    }
  },
  prettierConfig
];
