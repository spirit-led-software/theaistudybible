/// <reference types="@solidjs/start/env" />
/// <reference types="@solidjs/start/server" />

import type { Role } from '@/schemas/roles';
import type { Session, User } from 'lucia';

declare module '@solidjs/start/server' {
  export interface RequestEventLocals {
    session: Session | null;
    user: User | null;
    roles: Role[] | null;
  }
}

declare global {
  interface ImportMetaEnv {
    PUBLIC_WEBAPP_URL: string;
    PUBLIC_CDN_URL: string;
    PUBLIC_ANALYTICS_URL: string;
    PUBLIC_CLERK_PUBLISHABLE_KEY: string;
    PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
    PUBLIC_STAGE: string;
    PUBLIC_SENTRY_DSN: string;
    PUBLIC_SENTRY_ORG: string;
    PUBLIC_SENTRY_PROJECT_ID: string;
    PUBLIC_SENTRY_PROJECT_NAME: string;
  }
}
