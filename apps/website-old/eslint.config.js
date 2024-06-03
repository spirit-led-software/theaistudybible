// @ts-check

import { FlatCompat } from '@eslint/eslintrc';
import eslintConfig from '@theaistudybible/eslint-config';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import path from 'path';
import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

export default tseslint.config(
  ...eslintConfig,
  // @ts-ignore - Types are wrong here
  ...svelte.configs['flat/recommended'],
  ...svelte.configs['flat/prettier'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser
      }
    }
  },
  {
    ignores: ['build/', '.svelte-kit/', 'dist/']
  },
  {
    rules: {
      'svelte/valid-compile': 'warn'
    }
  },
  ...compat.extends('plugin:@tanstack/eslint-plugin-query/recommended'),
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
  }
);
