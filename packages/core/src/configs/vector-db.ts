interface VectorDBConfig {
  readUrl: string;
  writeUrl: string;
  documents: {
    tableName: string;
    dimensions: number;
  };
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
  documents: {
    tableName: process.env.VECTOR_DB_DOCS_TABLE!,
    dimensions: parseInt(process.env.VECTOR_DB_DOCS_DIMENSIONS!),
  },
};

export default config;
