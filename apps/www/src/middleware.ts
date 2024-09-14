import { createMiddleware } from '@solidjs/start/middleware';
import { clerkMiddleware } from 'clerk-solidjs/start/server';
import { Resource } from 'sst';

export default createMiddleware({
  onRequest: [
    clerkMiddleware({
      publishableKey: Resource.ClerkPublishableKey.value,
      secretKey: Resource.ClerkSecretKey.value,
    }),
    ({
      request: { url },
      locals: {
        auth: { sessionClaims, userId },
      },
    }) => {
      const path = new URL(url).pathname;
      if (
        path.startsWith('/admin') &&
        !(sessionClaims?.metadata.roles?.includes('admin') ?? false)
      ) {
        return new Response(null, {
          status: 302,
          headers: {
            location: '/',
          },
        });
      }
      if (path === '/' && userId) {
        return new Response(null, {
          status: 302,
          headers: {
            location: '/bible',
          },
        });
      }
      if (path === '/credits' && !userId) {
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
