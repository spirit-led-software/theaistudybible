import axiosRetry from 'axios-retry';

export default () => ({
  general: {
    environment: process.env.NODE_ENV,
    host: process.env.HOST,
    port: parseInt(process.env.PORT),
    apiUrl: process.env.API_URL,
    apiBasePath: process.env.API_BASE_PATH,
    websiteUrl: process.env.WEBSITE_URL,
  },
  auth: {
    connectionURI: process.env.AUTH_CONNECTION_URI,
    apiKey: process.env.AUTH_API_KEY,
    appName: 'ChatESV',
    adminEmail: process.env.AUTH_ADMIN_EMAIL,
    adminPassword: process.env.AUTH_ADMIN_PASSWORD,
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  axios: {
    'axios-retry': {
      retries: 5,
      retryDelay: (retryCount) => retryCount * 1000,
      retryCondition: (error) =>
        axiosRetry.isNetworkOrIdempotentRequestError(error),
    },
  },
  database: {
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
  },
  vectorDb: {
    url: process.env.VECTOR_DB_URL,
    apiKey: process.env.VECTOR_DB_API_KEY,
    collectionName: process.env.VECTOR_DB_COLLECTION_NAME,
    dimensions: parseInt(process.env.VECTOR_DB_COLLECTION_DIMENSIONS) || 1536,
  },
  webScraper: {
    threads: parseInt(process.env.WEB_SCRAPER_THREADS) || 4,
  },
});
