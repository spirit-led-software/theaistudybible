// @ts-check

import { fixupPluginRules } from '@eslint/compat';
import pluginJs from '@eslint/js';
import * as drizzlePlugin from 'eslint-plugin-drizzle';
import solidPlugin from 'eslint-plugin-solid';
import globals from 'globals';
import tsEslint from 'typescript-eslint';

export default tsEslint.config(
  {
    ignores: ['**/node_modules', '**/.sst', '**/.turbo', '**/.vinxi', '**/.output'],
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },
  pluginJs.configs.recommended,
  // TypeScript
  ...tsEslint.configs.recommendedTypeChecked,
  {
    ...solidPlugin.configs['flat/typescript'],
    languageOptions: {
      parserOptions: {
        project: [
          './tsconfig.json',
          'apps/*/tsconfig.json',
          'packages/*/tsconfig.json',
          'tools/*/tsconfig.json',
        ],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ],
    },
  },
  {
    files: ['**/*.{js,cjs,mjs,jsx}'],
    ...tsEslint.configs.disableTypeChecked,
  },
  {
    files: ['**/*.cjs'],
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  // Drizzle
  {
    plugins: {
      drizzle: fixupPluginRules(drizzlePlugin),
    },
    rules: {
      'drizzle/enforce-delete-with-where': ['error', { drizzleObjectName: ['db'] }],
      'drizzle/enforce-update-with-where': ['error', { drizzleObjectName: ['db'] }],
    },
  },
);
