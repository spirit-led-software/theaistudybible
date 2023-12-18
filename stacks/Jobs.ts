import { Job, type StackContext } from 'sst/constructs';

export function Jobs({ stack }: StackContext) {
  const hnswIndexJob = new Job(stack, 'hnswIndexJob', {
    handler: 'packages/functions/src/database/hnsw-index.handler',
    runtime: 'nodejs',
    memorySize: '3 GB',
    timeout: '4 hours',
    nodejs: {
      install: ['web-streams-polyfill'],
      esbuild: {
        external: ['web-streams-polyfill']
      }
    }
  });

  return {
    hnswIndexJob
  };
}