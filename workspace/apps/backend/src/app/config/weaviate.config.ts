type WeaviateConfig = {
  host: string;
  scheme: 'http' | 'https';
  apiKey: string;
  indexName: string;
};

export const config: WeaviateConfig = {
  host: process.env.WEAVIATE_HOST || 'localhost:8080',
  scheme: (process.env.WEAVIATE_SCHEME as 'http' | 'https') || 'http',
  apiKey: process.env.WEAVIATE_API_KEY,
  indexName: process.env.WEAVIATE_INDEX_NAME || 'Docs',
};

export default config;
