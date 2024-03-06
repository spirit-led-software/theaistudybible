// @ts-check

import eslint from '@eslint/js';
import sveltePlugin from 'eslint-plugin-svelte';
import globals from 'globals';
import svelteParser from 'svelte-eslint-parser';
import tsEslint from 'typescript-eslint';

export default tsEslint.config(
  eslint.configs.recommended,
  ...tsEslint.configs.recommended,
  {
    ignores: [
      '.sst/**',
      '**/sst-env.d.ts',
      '**/node_modules/**',
      '**/.svelte-kit/**',
      '**/*.config.js',
      '**/*.config.ts',
      '**/__generated__/**'
    ]
  },
  {
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json', './packages/*/tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.svelte'],
        ecmaVersion: 'latest'
      }
    }
  },
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
    },
    // @ts-ignore
    rules: {
      ...sveltePlugin.configs.recommended.rules
    }
  }
);
