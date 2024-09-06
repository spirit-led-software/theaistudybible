import { createMiddleware } from '@solidjs/start/middleware';
import { clerkMiddleware } from 'clerk-solidjs/server';
import { Resource } from 'sst';

export default createMiddleware({
  onRequest: [
    clerkMiddleware({
      publishableKey: Resource.ClerkPublishableKey.value,
      secretKey: Resource.ClerkSecretKey.value,
    }),
    ({ request, locals }) => {
      const path = new URL(request.url).pathname;
      if (
        path.startsWith('/admin') &&
        !(locals.auth.sessionClaims?.metadata.roles?.includes('admin') ?? false)
      ) {
        return new Response(null, {
          status: 302,
          headers: {
            location: '/',
          },
        });
      }
    },
  ],
});
