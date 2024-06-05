import { FlatCompat } from '@eslint/eslintrc';
import eslint from '@eslint/js';
import prettierPlugin from 'eslint-plugin-prettier';
import sonarjs from 'eslint-plugin-sonarjs';
import path from 'path';
import tsEslint from 'typescript-eslint';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

export default tsEslint.config(
  {
    ignores: ['**/node_modules/**', '**/*.config.{js,ts,mjs,cjs}', '**/sst-env.d.ts']
  },
  eslint.configs.recommended,
  // typescript eslint
  ...tsEslint.configs.recommended.map((config) => ({
    ...config,
    files: ['**/*.ts', '**/*.tsx']
  })),
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: [
          './tsconfig.json',
          '../../apps/**/tsconfig.json',
          '../../packages/**/tsconfig.json'
        ],
        tsconfigRootDir: __dirname
      }
    },
    plugins: {
      '@typescript-eslint': tsEslint.plugin
    },
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/no-import-type-side-effects': 'error'
    }
  },
  // prettier
  {
    plugins: {
      prettier: prettierPlugin
    }
  },
  // drizzle
  ...compat.config({
    plugins: ['drizzle'],
    extends: ['plugin:drizzle/recommended'],
    rules: {
      'drizzle/enforce-delete-with-where': [
        'error',
        {
          drizzleObjectName: 'db'
        }
      ],
      'drizzle/enforce-update-with-where': [
        'error',
        {
          drizzleObjectName: 'db'
        }
      ]
    }
  }),
  // sonarjs
  sonarjs.configs.recommended,
  {
    rules: {
      ...Object.keys(sonarjs.rules).reduce((acc, rule) => {
        acc[`sonarjs/${rule}`] = 'warn';
        return acc;
      }, {})
    }
  }
);
