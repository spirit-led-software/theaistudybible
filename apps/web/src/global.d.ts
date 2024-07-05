/// <reference types="@solidjs/start/env" />
/// <reference types="@solidjs/start/server" />

import { clerk } from './lib/server/clerk';

declare module '@solidjs/start/server' {
  export interface RequestEventLocals {
    auth: ReturnType<Awaited<ReturnType<(typeof clerk)['authenticateRequest']>>['toAuth']>;
  }
}

export {};
