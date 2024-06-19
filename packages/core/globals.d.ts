declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Environment
      NODE_ENV: 'development' | 'production';

      // Database
      DATABASE_URL: string;

      // Cache
      REDIS_URL: string;

      // Vector DB
      QDRANT_URL: string;
      QDRANT_API_KEY: string;

      // Storage
      S3_BUCKET: string;
      S3_ENDPOINT: string;
      S3_ACCESS_KEY: string;
      S3_SECRET_KEY: string;

      // AI
      UNSTRUCTURED_API_KEY: string;
      OPENAI_API_KEY: string;
      ANTHROPIC_API_KEY: string;

      // Email
      EMAIL_SERVER_HOST: string;
      EMAIL_SERVER_PORT: string;
      EMAIL_SERVER_USERNAME: string;
      EMAIL_SERVER_PASSWORD: string;

      // Admin User
      ADMIN_EMAIL: string;
      ADMIN_PASSWORD: string;

      // Clerk
      CLERK_PUBLISHABLE_KEY: string;
      CLERK_SECRET_KEY: string;
      CLERK_WEBHOOK_SECRET: string;

      // Revenue Cat
      REVENUECAT_PROJECT_ID: string;
      REVENUECAT_API_KEY: string;
      REVENUECAT_STRIPE_API_KEY: string;
      REVENUECAT_WEBHOOK_SECRET: string;

      // Stripe
      STRIPE_PUBLIC_KEY: string;
      STRIPE_SECRET_KEY: string;
      STRIPE_WEBHOOK_SECRET: string;
    }
  }
  interface CustomJwtSessionClaims {
    metadata: {
      roles?: string[];
      bibleTranslation?: string;
      stripeCustomerId?: string;
    };
  }
}

export {};
