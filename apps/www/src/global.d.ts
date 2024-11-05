/// <reference types="@solidjs/start/env" />
/// <reference types="@solidjs/start/server" />

import type { Role } from '@/schemas/roles';
import type { Session, User } from 'lucia';
import type { PostHog } from 'posthog-node';

declare module '@solidjs/start/server' {
  export interface RequestEventLocals {
    session: Session | null;
    user: User | null;
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
  var posthog: PostHog;
  namespace NodeJS {
    interface ProcessEnv extends Env {}
  }
  interface ImportMetaEnv extends Env {}
}
