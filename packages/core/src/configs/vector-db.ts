interface VectorDBConfig {
  readUrl: string;
  writeUrl: string;
  documents: {
    tableName: string;
  };
}

export const config: VectorDBConfig = {
  readUrl:
    process.env.VECTOR_DB_READONLY_URL || process.env.VECTOR_DB_READWRITE_URL!,
  writeUrl: process.env.VECTOR_DB_READWRITE_URL!,
  documents: {
    tableName: process.env.VECTOR_DB_DOCS_TABLE!,
  },
};

export default config;
