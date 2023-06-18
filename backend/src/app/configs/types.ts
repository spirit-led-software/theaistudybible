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

export type UnstructuredConfig = {
  apiUrl: string;
};

export type VectorDbConfig = {
  scheme: 'http' | 'https';
  host: string;
  port: number;
  apiKey: string;
  collectionName: string;
  size: number;
  distance: 'Euclid' | 'Cosine';
};

export type WebScraperConfig = {
  threads: number;
};
