import { createMiddleware } from '@solidjs/start/middleware';
import { clerkMiddleware } from 'clerk-solidjs/start/server';
import { Resource } from 'sst';

export default createMiddleware({
  onRequest: [
    clerkMiddleware({
      publishableKey: Resource.ClerkPublishableKey.value,
      secretKey: Resource.ClerkSecretKey.value,
    }),
  ],
});
