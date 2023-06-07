type WeaviateConfig = {
  host: string;
  scheme: 'http' | 'https';
  apiKey: string;
};

export const config: WeaviateConfig = {
  host: process.env.WEAVIATE_HOST || 'localhost:8080',
  scheme: (process.env.WEAVIATE_SCHEME as any) || 'http',
  apiKey: process.env.WEAVIATE_API_KEY,
};

export default config;
