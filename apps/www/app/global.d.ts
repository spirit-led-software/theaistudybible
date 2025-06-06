interface Env {
  PUBLIC_WEBAPP_URL: string;
  PUBLIC_CDN_URL: string;
  PUBLIC_POSTHOG_API_HOST: string;
  PUBLIC_POSTHOG_API_KEY: string;
  PUBLIC_CLERK_PUBLISHABLE_KEY: string;
  PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
  PUBLIC_STAGE: string;
  PUBLIC_SENTRY_DSN: string;
  PUBLIC_SENTRY_ORG: string;
  PUBLIC_SENTRY_PROJECT_ID: string;
  PUBLIC_SENTRY_PROJECT_NAME: string;
  SENTRY_AUTH_TOKEN: string;
  PUBLIC_DONATION_LINK: string;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Env {}
  }
  interface ImportMetaEnv extends Env {}
}

export {};
