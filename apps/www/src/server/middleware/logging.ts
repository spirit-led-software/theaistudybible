import { createId } from '@/core/utils/id';
import type { FetchEvent } from '@solidjs/start/server';
import { Resource } from 'sst';
import { getHeader } from 'vinxi/http';

export namespace loggingMiddleware {
  export const onRequest = () => {
    return async ({ nativeEvent, request, locals }: FetchEvent) => {
      const requestId = createId();
      locals.requestId = requestId;

      const url = new URL(request.url);
      const userAgent = getHeader(nativeEvent, 'user-agent') ?? 'unknown';
      const ip =
        getHeader(nativeEvent, 'x-forwarded-for')?.split(',')[0].trim() ??
        getHeader(nativeEvent, 'x-real-ip') ??
        'unknown';

      console.log(`${requestId} <-- ${request.method} ${url.pathname}`);
      console.log(`${requestId} (?) IP: ${ip} | User-Agent: ${userAgent}`);
      if (Resource.Dev.value === 'true') {
        const body = await request.clone().text();
        if (body) console.log(`\t\t${body}`);
      }
    };
  };

  export const onBeforeResponse = () => {
    return ({ request, response, locals }: FetchEvent) => {
      const url = new URL(request.url);
      console.log(`${locals.requestId} --> ${request.method} ${url.pathname} ${response.status}`);
    };
  };
}
