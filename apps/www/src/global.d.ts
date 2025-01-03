import type { Role } from '@/schemas/roles/types';
import type { UserSettings } from '@/schemas/users/types';
import type { Session, User } from 'lucia';
import type { PostHog } from 'posthog-node';

declare module '@solidjs/start/server' {
  export interface RequestEventLocals {
    requestId: string;
    session: Session | null;
    user: User | null;
    settings: UserSettings | null;
    roles: Role[] | null;
  }
}

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
}

declare global {
  export var posthog: PostHog | undefined;
  namespace NodeJS {
    interface ProcessEnv extends Env {}
  }
  interface ImportMetaEnv extends Env {}
}
