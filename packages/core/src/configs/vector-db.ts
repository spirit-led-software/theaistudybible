interface VectorDBConfig {
  url: string;
  collectionName: string;
}

export const config: VectorDBConfig = {
  url: process.env.VECTOR_DB_URL as string,
  collectionName: process.env.VECTOR_DB_COLLECTION_NAME as string,
};

export default config;
