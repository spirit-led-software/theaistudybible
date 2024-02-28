import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: 'graphql/schema.graphql',
  generates: {
    'packages/functions/src/graphql/__generated__/resolver-types.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        enumsAsTypes: true,
        useTypeImports: true,
        useIndexSignature: true,
        contextType: '../index#Context'
      }
    },
    './graphql.schema.json': {
      plugins: ['introspection']
    }
  }
};

export default config;
