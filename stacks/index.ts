export * from './API';
export * from './Admin-API';
export * from './Auth';
export * from './Chat-API';
export * from './Constants';
export * from './Crons';
export * from './Database';
export * from './Database-Scripts';
export * from './GraphQL-API';
export * from './Jobs';
export * from './Layers';
export * from './Queues';
export * from './Rest-API';
export * from './S3';
export * from './Website';

export const COMMON_ENV_VARS: Record<string, string> = {
  // Environment
  IS_LOCAL: process.env.IS_LOCAL!,
  NODE_ENV: process.env.NODE_ENV!,

  // Unstructured
  UNSTRUCTURED_API_KEY: process.env.UNSTRUCTURED_API_KEY!,

  // OpenAI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY!,

  // Google AI
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY!,

  // Fireworks AI
  FIREWORKS_API_KEY: process.env.FIREWORKS_API_KEY!,

  // Revenue Cat
  REVENUECAT_PROJECT_ID: process.env.REVENUECAT_PROJECT_ID!,
  REVENUECAT_API_KEY: process.env.REVENUECAT_API_KEY!,
  REVENUECAT_STRIPE_API_KEY: process.env.REVENUECAT_STRIPE_API_KEY!,
  REVENUECAT_WEBHOOK_SECRET: process.env.REVENUECAT_WEBHOOK_SECRET!,

  // Apple Auth
  APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID!,
  APPLE_TEAM_ID: process.env.APPLE_TEAM_ID!,
  APPLE_KEY_ID: process.env.APPLE_KEY_ID!,

  // Google Auth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,

  // Email Auth
  EMAIL_FROM: process.env.EMAIL_FROM!,
  EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO!,
  EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST!,
  EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT!,
  EMAIL_SERVER_USERNAME: process.env.EMAIL_SERVER_USERNAME!,
  EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD!,

  // Admin User
  ADMIN_EMAIL: process.env.ADMIN_EMAIL!,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD!,

  // Stripe
  STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY!,
  STRIPE_API_KEY: process.env.STRIPE_API_KEY!,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,
};
