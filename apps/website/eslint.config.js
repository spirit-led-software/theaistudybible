// @ts-check

import { FlatCompat } from '@eslint/eslintrc';
import eslintConfig from '@theaistudybible/eslint-config';
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
  ...compat.extends('plugin:@tanstack/eslint-plugin-query/recommended')
);
