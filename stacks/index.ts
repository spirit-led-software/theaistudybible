export * from "./API";
export * from "./Auth";
export * from "./Constants";
export * from "./Crons";
export * from "./DatabaseScripts";
export * from "./Queues";
export * from "./S3";
export * from "./Website";

export const STATIC_ENV_VARS: Record<string, string> = {
  // Environment
  IS_LOCAL: process.env.IS_LOCAL!,
  NODE_ENV: process.env.NODE_ENV!,

  // Neon Database
  NEON_API_KEY: process.env.NEON_API_KEY!,
  // Vector DB Table
  VECTOR_DB_DOCS_TABLE: process.env.VECTOR_DB_DOCS_TABLE!,
  VECTOR_DB_DOCS_DIMENSIONS: process.env.VECTOR_DB_DOCS_DIMENSIONS!,

  // LLM
  LLM_API_KEY: process.env.LLM_API_KEY!,
  LLM_PROMPT_MODEL_NAME: process.env.LLM_PROMPT_MODEL_NAME!,
  LLM_COMPLETIONS_MODEL_NAME: process.env.LLM_COMPLETIONS_MODEL_NAME!,
  LLM_EMBEDDINGS_MODEL_NAME: process.env.LLM_EMBEDDINGS_MODEL_NAME!,
  LLM_TEMPERATURE: process.env.LLM_TEMPERATURE!,

  // Replicate
  REPLICATE_API_KEY: process.env.REPLICATE_API_KEY!,
  REPLICATE_IMAGE_MODEL: process.env.REPLICATE_IMAGE_MODEL!,

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

  // Stripe
  STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY!,
  STRIPE_API_KEY: process.env.STRIPE_API_KEY!,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,
};
