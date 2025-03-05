import { cache } from '@/core/cache';
import { createMiddleware } from '@tanstack/react-start';
import { getRequestIP } from '@tanstack/react-start/server';
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: cache,
  limiter: Ratelimit.slidingWindow(2000, '1m'),
});

export const rateLimitingMiddleware = createMiddleware().server(async ({ next }) => {
  const ip = getRequestIP({ xForwardedFor: true });

  const { success, limit, remaining, reset } = await ratelimit.limit(`toplevel:${ip}`);
  if (!success) {
    throw new Response('Too Many Requests', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      },
    });
  }

  return next();
});
