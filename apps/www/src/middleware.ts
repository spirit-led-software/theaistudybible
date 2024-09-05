import { cache } from '@/core/cache';
import { getTimeStringFromSeconds } from '@/core/utils/date';
import { createMiddleware } from '@solidjs/start/middleware';
import { Ratelimit } from '@upstash/ratelimit';
import { clerkMiddleware } from 'clerk-solidjs/server';
import { Resource } from 'sst';
import { getRequestIP } from 'vinxi/http';

export default createMiddleware({
  onRequest: [
    async ({ nativeEvent, clientAddress }) => {
      const ip = getRequestIP(nativeEvent) || clientAddress;
      if (!ip) {
        return Response.json(
          {
            message:
              'Your IP address is hidden so we cannot serve your request. Please disable your VPN or proxy and try again.',
          },
          {
            status: 403,
          },
        );
      } else {
        const ratelimit = new Ratelimit({
          redis: cache,
          limiter: Ratelimit.slidingWindow(1200, '5 m'),
        });

        const { success, limit, remaining, reset } = await ratelimit.limit(ip);

        if (!success) {
          return Response.json(
            {
              message: `You have issued too many requests. Please wait ${getTimeStringFromSeconds(
                (reset - Date.now()) / 1000,
              )} before trying again.`,
            },
            {
              status: 429,
              headers: {
                'Retry-After': ((reset - Date.now()) / 1000).toString(),
                'X-RateLimit-Limit': limit.toString(),
                'X-RateLimit-Remaining': remaining.toString(),
                'X-RateLimit-Reset': new Date(reset).toISOString(),
              },
            },
          );
        }
      }
    },
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
