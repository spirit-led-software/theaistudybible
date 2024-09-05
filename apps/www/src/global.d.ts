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
    PUBLIC_API_URL: string;
  }
}

export {};
