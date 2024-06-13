import { cache } from '@lib/server/cache';
import { createMiddleware } from '@solidjs/start/middleware';
import { getTimeStringFromSeconds } from '@theaistudybible/core/util/date';
import { Ratelimit } from '@upstash/ratelimit';
import { getCookie, getRequestIP } from 'vinxi/http';
import { clerk } from './lib/server/clerk';

const ratelimit = new Ratelimit({
  redis: cache,
  limiter: Ratelimit.slidingWindow(1200, '5 m')
});

export default createMiddleware({
  onRequest: [
    // @ts-expect-error - Doesn't accept Promise<void | Response> though it should
    async ({ nativeEvent }) => {
      const ip = getRequestIP(nativeEvent);
      if (!ip) {
        return Response.json(
          {
            message:
              'Your IP address is hidden so we cannot serve your request. Please disable your VPN or proxy and try again.'
          },
          {
            status: 403
          }
        );
      } else {
        const ratelimitResult = await ratelimit.limit(ip);
        if (!ratelimitResult.success) {
          return Response.json(
            {
              message: `You have issued too many requests. Please wait ${getTimeStringFromSeconds(
                ratelimitResult.remaining
              )} before trying again.`
            },
            {
              status: 429
            }
          );
        }
      }
    },
    async ({ locals, nativeEvent }) => {
      const sessionToken = getCookie(nativeEvent, '__session');
      if (sessionToken) {
        try {
          const claims = await clerk.verifyToken(sessionToken);
          locals.auth = {
            userId: claims.sub,
            claims
          };
        } catch {
          // Do nothing
        }
      }
    }
  ]
});
