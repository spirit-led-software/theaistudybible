export const config = {
  host: process.env.WEAVIATE_HOST || 'localhost:8080',
  scheme: process.env.WEAVIATE_SCHEME || 'http',
  apiKey: process.env.WEAVIATE_API_KEY,
};

export default config;
