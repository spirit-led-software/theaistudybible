export * from "./API";
export * from "./Auth";
export * from "./Constants";
export * from "./Crons";
export * from "./Database";
export * from "./DatabaseScripts";
export * from "./Queues";
export * from "./S3";
export * from "./Website";

export const STATIC_ENV_VARS: Record<string, string> = {
  // Vector DB
  VECTOR_DB_URL: process.env.VECTOR_DB_URL!,
  VECTOR_DB_API_KEY: process.env.VECTOR_DB_API_KEY!,
  VECTOR_DB_COLLECTION_NAME: process.env.VECTOR_DB_COLLECTION_NAME!,
  VECTOR_DB_COLLECTION_DIMENSIONS: process.env.VECTOR_DB_COLLECTION_DIMENSIONS!,

  // LLM
  LLM_API_KEY: process.env.LLM_API_KEY!,
  LLM_MODEL_NAME: process.env.LLM_MODEL_NAME!,
  LLM_EMBEDDINGS_MODEL_NAME: process.env.LLM_EMBEDDINGS_MODEL_NAME!,
  LLM_TEMPERATURE: process.env.LLM_TEMPERATURE!,

  // Unstructured
  UNSTRUCTURED_API_KEY: process.env.UNSTRUCTURED_API_KEY!,

  // Google Auth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,

  // Facebook Auth
  FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID!,
  FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET!,

  // Email Auth
  EMAIL_FROM: process.env.EMAIL_FROM!,
  EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO!,
  EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST!,
  EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT!,
  EMAIL_SERVER_USERNAME: process.env.EMAIL_SERVER_USERNAME!,
  EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD!,

  // Admin User
  ADMIN_EMAIL: process.env.ADMIN_EMAIL!,
};
