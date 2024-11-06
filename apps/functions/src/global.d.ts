import type { PostHog } from 'posthog-node';

declare global {
  export var posthog: PostHog | undefined;
  namespace NodeJS {
    interface ProcessEnv {
      POSTHOG_API_KEY: string;
      POSTHOG_API_HOST: string;
      SENTRY_DSN: string;
      SENTRY_TRACES_SAMPLE_RATE: string;
    }
  }
}
