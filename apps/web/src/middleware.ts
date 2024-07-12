import { createMiddleware } from '@solidjs/start/middleware';
import { cache } from '@theaistudybible/core/cache';
import { getTimeStringFromSeconds } from '@theaistudybible/core/util/date';
import { clerkMiddleware } from 'clerk-solidjs';
import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
import { getRequestIP } from 'vinxi/http';

const ratelimit = new RateLimiterRedis({
  storeClient: cache,
  points: 1200,
  duration: 5 * 60
});

export default createMiddleware({
  onRequest: [
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
        try {
          await ratelimit.consume(ip);
        } catch (ratelimitResult) {
          if (ratelimitResult instanceof RateLimiterRes) {
            return Response.json(
              {
                message: `You have issued too many requests. Please wait ${getTimeStringFromSeconds(
                  ratelimitResult.msBeforeNext / 1000
                )} before trying again.`
              },
              {
                status: 429,
                headers: {
                  'Retry-After': (ratelimitResult.msBeforeNext / 1000).toString(),
                  'X-RateLimit-Limit': ratelimit.points.toString(),
                  'X-RateLimit-Remaining': ratelimitResult.remainingPoints.toString(),
                  'X-RateLimit-Reset': new Date(
                    Date.now() + ratelimitResult.msBeforeNext
                  ).toISOString()
                }
              }
            );
          } else {
            return Response.json(
              {
                message: 'An error occurred. Please try again later.'
              },
              {
                status: 500
              }
            );
          }
        }
      }
    },
    clerkMiddleware({
      publishableKey: process.env.PUBLIC_CLERK_PUBLISHABLE_KEY,
      secretKey: process.env.CLERK_SECRET_KEY
    })
  ]
});
