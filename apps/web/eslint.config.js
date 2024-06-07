// @ts-check

import eslintConfig from '@theaistudybible/eslint-config';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/.vinxi/**', '**/.output/**']
  },
  ...eslintConfig
);
