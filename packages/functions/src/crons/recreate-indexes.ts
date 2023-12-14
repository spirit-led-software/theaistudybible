import { getDocumentVectorStore, getPartialHnswIndexInfos } from '@services/vector-db';
import type { Handler } from 'aws-lambda';

export const handler: Handler = async (event) => {
  console.log('Recreating db indexes:', event);

  try {
    const errors: unknown[] = [];

    try {
      console.log('Recreating HNSW index');
      const vectorDb = await getDocumentVectorStore();
      await vectorDb.ensureTableInDatabase();
      await vectorDb.createHnswIndex({ recreate: true });
    } catch (e) {
      console.log("Couldn't recreate HNSW index:", e);
      errors.push(e);
    }

    console.log('Recreating partial HNSW indexes');
    for (const { name, filters } of getPartialHnswIndexInfos()) {
      try {
        console.log(
          `Creating partial HNSW index on documents: ${name} with filters: ${JSON.stringify(
            filters
          )}`
        );
        const filteredVectorDb = await getDocumentVectorStore({
          filters
        });
        await filteredVectorDb.createPartialHnswIndex(name, { recreate: true });
      } catch (e) {
        console.log("Couldn't recreate partial HNSW index:", e);
        errors.push(e);
      }
    }

    if (errors.length) {
      throw new Error(`Database indexes recreation failed: ${errors.join(', ')}`);
    }

    console.log('Database indexes recreated');
  } catch (e) {
    console.log("Couldn't recreate db indexes:", e);
    throw e;
  }
};
