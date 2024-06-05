/// <reference types="@solidjs/start/env" />
/// <reference types="@solidjs/start/server" />

declare module '@solidjs/start/server' {
  export interface RequestEventLocals {
    auth: {
      userId?: string;
      claims?: import('@clerk/types').JwtPayload;
    };
  }
}

export {};
