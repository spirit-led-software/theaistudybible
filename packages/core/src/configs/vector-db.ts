export type VectorDBConfig = {
  url: string;
  apiKey: string;
  collectionName: string;
  collectionDimensions: number;
};

export const config: VectorDBConfig = {
  url: process.env.VECTOR_DB_URL as string,
  apiKey: process.env.VECTOR_DB_API_KEY as string,
  collectionName: process.env.VECTOR_DB_COLLECTION_NAME as string,
  collectionDimensions: parseInt(
    process.env.VECTOR_DB_COLLECTION_DIMENSIONS as string
  ),
};

export default config;
