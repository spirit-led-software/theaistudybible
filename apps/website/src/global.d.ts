/// <reference types="@solidjs/start/env" />

import type { JwtPayload } from '@clerk/types';
import '@solidjs/start/server';

declare module '@solidjs/start/server' {
  export interface RequestEventLocals {
    auth: {
      userId?: string;
      claims?: JwtPayload;
    };
  }
}
