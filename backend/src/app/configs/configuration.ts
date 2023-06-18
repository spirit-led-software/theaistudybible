import axiosRetry from 'axios-retry';

export default () => ({
  axios: {
    'axios-retry': {
      retries: 5,
      retryDelay: (retryCount) => retryCount * 1000,
      retryCondition: (error) =>
        axiosRetry.isNetworkOrIdempotentRequestError(error),
    },
  },
  database: {
    type: process.env.DATABASE_TYPE,
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT),
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    name: process.env.DATABASE_NAME,
    runMigrations: process.env.RUN_DATABASE_MIGRATIONS === 'true',
  },
  llm: {
    apiKey: process.env.LLM_API_KEY,
    temperature: parseInt(process.env.LLM_TEMPERATURE) || 1,
    modelName: process.env.LLM_MODEL_NAME,
    embeddingsModelName: process.env.LLM_EMBEDDINGS_MODEL_NAME,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
  },
  s3: {
    bucketName: process.env.S3_BUCKET_NAME,
    region: process.env.S3_REGION,
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  unstructured: {
    apiUrl: process.env.UNSTRUCTURED_API_URL,
  },
  vectorDb: {
    scheme: process.env.VECTOR_DB_SCHEME,
    host: process.env.VECTOR_DB_HOST,
    port: parseInt(process.env.VECTOR_DB_PORT),
    apiKey: process.env.VECTOR_DB_API_KEY,
    collectionName: process.env.VECTOR_DB_COLLECTION_NAME,
    size: parseInt(process.env.VECTOR_DB_COLLECTION_SIZE),
    distance: 'Cosine',
  },
  webScraper: {
    threads: parseInt(process.env.WEB_SCRAPER_THREADS) || 4,
  },
});
