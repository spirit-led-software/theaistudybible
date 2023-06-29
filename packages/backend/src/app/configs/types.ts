export type GeneralConfig = {
  environment: string;
  host: string;
  port: number;
  apiUrl: string;
  apiBasePath: string;
  websiteUrl: string;
};

export type DatabaseConfig = {
  type: string;
  host: string;
  port: number;
  username: string;
  password: string;
  name: string;
  runMigrations: boolean;
};

export type LLMConfig = {
  apiKey: string;
  temperature: number;
  modelName: string;
  embeddingsModelName: string;
};

export type RedisConfig = {
  host: string;
  port: number;
  password: string;
};

export type S3Config = {
  bucketName: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
};

export type VectorDBConfig = {
  type: 'pinecone' | 'weaviate' | 'qdrant' | 'milvus';
  scheme: 'http' | 'https' | 'grpc';
  host: string;
  port: number;
  apiKey: string;
  collectionName: string;
  dimensions: number;
  distance: 'Cosine' | 'Euclid';
};

export type WebScraperConfig = {
  threads: number;
};

export type AuthConfig = {
  connectionURI: string;
  apiKey: string;
  appName: string;
  adminEmail: string;
  adminPassword: string;
  google: {
    clientId: string;
    clientSecret: string;
  };
};
