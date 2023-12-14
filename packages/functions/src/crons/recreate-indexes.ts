import { getDocumentVectorStore, getPartialHnswIndexInfos } from '@services/vector-db';
import type { Handler } from 'aws-lambda';

export const handler: Handler = async (event) => {
  console.log('Recreating db indexes:', event);

  try {
    console.log('Recreating HNSW index');
    const vectorDb = await getDocumentVectorStore();
    await vectorDb.ensureTableInDatabase();
    vectorDb.createHnswIndex({ recreate: true });

    console.log('Recreating partial HNSW indexes');
    for (const { name, filters } of getPartialHnswIndexInfos()) {
      console.log(
        `Creating partial HNSW index on documents: ${name} with filters: ${JSON.stringify(filters)}`
      );
      const filteredVectorDb = await getDocumentVectorStore({
        filters
      });
      filteredVectorDb.createPartialHnswIndex(name, { recreate: true });
    }
    console.log('Database indexes recreated');
  } catch (e) {
    console.log("Couldn't recreate db indexes:", e);
    throw e;
  }
};
