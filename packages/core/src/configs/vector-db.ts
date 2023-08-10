interface VectorDBConfig {
  readUrl: string;
  writeUrl: string;
  tableName: string;
  dimensions: number;
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
  tableName: process.env.VECTOR_DB_TABLE_NAME!,
  dimensions: parseInt(process.env.VECTOR_DB_DIMENSIONS!),
};

export default config;
