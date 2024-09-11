/// <reference types="@solidjs/start/env" />
/// <reference types="@solidjs/start/server" />
import type { AuthReturn } from 'clerk-solidjs/server';

declare module '@solidjs/start/server' {
  export interface RequestEventLocals {
    auth: AuthReturn;
  }
}

declare global {
  interface ImportMetaEnv {
    PUBLIC_WEBSITE_URL: string;
    PUBLIC_CDN_URL: string;
    PUBLIC_CLERK_PUBLISHABLE_KEY: string;
    PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
  }
}
