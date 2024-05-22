// @ts-check

import eslintConfig from '@revelationsai/eslint-config';
import tseslint from 'typescript-eslint';

export default tseslint.config(...eslintConfig, {
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^\\$\\$(Props|Events|Slots|Generic)$'
      }
    ]
  }
});
