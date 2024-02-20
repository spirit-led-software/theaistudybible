import {
  getDocumentVectorStore,
  getPartialHnswIndexInfos
} from '@revelationsai/server/lib/vector-db';
import { JobHandler } from 'sst/node/job';
import 'web-streams-polyfill/dist/polyfill.es2018.js';

declare module 'sst/node/job' {
  export interface JobTypes {
    hnswIndexJob: {
      vectorDbOptions: {
        recreateIndexes?: boolean;
      };
    };
  }
}

export const handler = JobHandler('hnswIndexJob', async (payload) => {
  console.log('Received HNSW index event: ', payload);
  const { vectorDbOptions } = payload;

  const errors: unknown[] = [];
  try {
    console.log('Creating HNSW index');
    const vectorDb = await getDocumentVectorStore();
    await vectorDb.ensureTableInDatabase();
    await vectorDb.createHnswIndex({ recreate: vectorDbOptions.recreateIndexes });
  } catch (e) {
    console.log('Error creating HNSW index:', e);
    errors.push(e);
  }

  console.log('Creating partial HNSW indexes');
  for (const { name, filters } of getPartialHnswIndexInfos()) {
    try {
      console.log(
        `Creating partial HNSW index on documents: ${name} with filters: ${JSON.stringify(filters)}`
      );
      const filteredVectorDb = await getDocumentVectorStore({
        filters
      });
      await filteredVectorDb.createPartialHnswIndex(name, {
        recreate: vectorDbOptions.recreateIndexes
      });
    } catch (e) {
      console.log('Error creating partial HNSW index:', e);
      errors.push(e);
    }
  }

  if (errors.length) {
    throw new Error(`Database seeding failed: ${errors.join(', ')}`);
  }
});
