interface VectorDBConfig {
  readUrl: string;
  writeUrl: string;
  collectionName: string;
}

export const config: VectorDBConfig = {
  readUrl:
    process.env.VECTOR_DB_READ_URL && process.env.VECTOR_DB_READ_URL !== ""
      ? process.env.VECTOR_DB_READ_URL
      : process.env.VECTOR_DB_URL!,
  writeUrl:
    process.env.VECTOR_DB_WRITE_URL && process.env.VECTOR_DB_WRITE_URL !== ""
      ? process.env.VECTOR_DB_WRITE_URL!
      : process.env.VECTOR_DB_URL!,
  collectionName: process.env.VECTOR_DB_COLLECTION_NAME!,
};

export default config;
