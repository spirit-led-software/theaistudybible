import { cache } from '@/core/cache';
import type { FetchEvent } from '@solidjs/start/server';
import { Ratelimit } from '@upstash/ratelimit';
import { getHeader } from 'vinxi/http';

const ratelimit = new Ratelimit({
  redis: cache,
  limiter: Ratelimit.slidingWindow(2000, '1 m'),
});

export const rateLimitingMiddleware = () => {
  return async ({ nativeEvent }: FetchEvent) => {
    const ip =
      getHeader(nativeEvent, 'x-forwarded-for')?.split(',')[0].trim() ??
      getHeader(nativeEvent, 'x-real-ip') ??
      'ip';

    const { success, limit, remaining, reset } = await ratelimit.limit(`toplevel:${ip}`);
    if (!success) {
      return new Response('Too Many Requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      });
    }
  };
};
