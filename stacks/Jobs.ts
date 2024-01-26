import { Database } from '@stacks';
import { Job, dependsOn, use, type StackContext } from 'sst/constructs';

export function Jobs({ stack }: StackContext) {
  dependsOn(Database);

  const { neonBranch } = use(Database);

  const hnswIndexJob = new Job(stack, 'hnswIndexJob', {
    handler: 'packages/functions/src/database/hnsw-index.handler',
    runtime: 'nodejs',
    memorySize: '3 GB',
    timeout: '4 hours',
    nodejs: {
      install: ['web-streams-polyfill']
    },
    environment: {
      DATABASE_READWRITE_URL: neonBranch.urls.dbReadWriteUrl,
      DATABASE_READONLY_URL: neonBranch.urls.dbReadOnlyUrl,
      VECTOR_DB_READWRITE_URL: neonBranch.urls.vectorDbReadWriteUrl,
      VECTOR_DB_READONLY_URL: neonBranch.urls.vectorDbReadOnlyUrl
    }
  });

  return {
    hnswIndexJob
  };
}
