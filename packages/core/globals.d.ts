/// <reference path="../../.sst/types.generated.ts" />

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Environment
      SST_LIVE: 'true' | 'false';
      NODE_ENV: 'development' | 'production';

      // Database
      NEON_API_KEY: string;
      DATABASE_SEED: 'true' | 'false';

      // Upstash console
      UPSTASH_EMAIL: string;
      UPSTASH_API_KEY: string;

      // AI
      UNSTRUCTURED_API_KEY: string;
      OPENAI_API_KEY: string;
      ANTHROPIC_API_KEY: string;

      // LangChain & LangSmith
      LANGCHAIN_TRACING_V2: 'true' | 'false';
      LANGCHAIN_ENDPOINT: string;
      LANGCHAIN_API_KEY: string;
      LANGCHAIN_PROJECT: string;
      LANGCHAIN_CALLBACKS_BACKGROUND: 'true' | 'false';

      // Clerk
      CLERK_PUBLISHABLE_KEY: string;
      CLERK_SECRET_KEY: string;
      CLERK_WEBHOOK_SECRET: string;

      // Revenue Cat
      REVENUECAT_PROJECT_ID: string;
      REVENUECAT_API_KEY: string;
      REVENUECAT_STRIPE_API_KEY: string;
      REVENUECAT_WEBHOOK_SECRET: string;

      // Email
      EMAIL_SERVER_HOST: string;
      EMAIL_SERVER_PORT: string;
      EMAIL_SERVER_USERNAME: string;
      EMAIL_SERVER_PASSWORD: string;

      // Admin User
      ADMIN_EMAIL: string;
      ADMIN_PASSWORD: string;

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
