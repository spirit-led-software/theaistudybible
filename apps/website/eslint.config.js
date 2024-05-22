// @ts-check

import { FlatCompat } from '@eslint/eslintrc';
import eslintConfig from '@theaistudybible/eslint-config';
import sveltePlugin from 'eslint-plugin-svelte';
import globals from 'globals';
import path from 'path';
import svelteParser from 'svelte-eslint-parser';
import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'url';

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

export default tseslint.config(
  ...eslintConfig,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^\\$\\$(Props|Events|Slots|Generic)$'
        }
      ]
    }
  },
  // Tanstack Query
  ...compat.config({
    plugins: ['@tanstack/eslint-plugin-query'],
    extends: ['plugin:@tanstack/eslint-plugin-query/recommended']
  }),
  {
    files: ['**/*.svelte'],
    plugins: {
      svelte: sveltePlugin
    },
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: '@typescript-eslint/parser'
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      }
    }
  },
  // Svelte
  // @ts-ignore
  ...sveltePlugin.configs['flat/recommended']
);
