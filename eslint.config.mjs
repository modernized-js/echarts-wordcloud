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
    files: ['webpack.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: globals.node
    }
  },
  prettierConfig
];
