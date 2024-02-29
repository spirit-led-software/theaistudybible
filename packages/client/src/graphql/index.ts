import { initGraphQLTada } from 'gql.tada';
import type { introspection } from '../../../../graphql/introspection';

export const graphql = initGraphQLTada<{
  introspection: introspection;
  scalars: {
    Date: Date;
    Metadata: string;
  };
}>();

export { readFragment } from 'gql.tada';
export type { FragmentOf, ResultOf, VariablesOf } from 'gql.tada';
