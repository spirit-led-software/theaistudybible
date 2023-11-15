export const config = {
  readUrl:
    process.env.VECTOR_DB_READONLY_URL || process.env.VECTOR_DB_READWRITE_URL!,
  writeUrl: process.env.VECTOR_DB_READWRITE_URL!,
  docEmbeddingContentLength: 1536,
  docEmbeddingContentOverlap: 384,
};

export default config;
