import { createId } from '@/core/utils/id';
import { createMiddleware } from '@tanstack/react-start';
import { getHeader, getRequestIP, getWebRequest } from '@tanstack/react-start/server';
import { Resource } from 'sst';

export const loggingMiddleware = createMiddleware().server(async ({ next }) => {
  const requestId = createId();
  const request = getWebRequest();
  if (!request) {
    throw new Error('Request not found');
  }

  const url = new URL(request.url);
  const userAgent = getHeader('user-agent') ?? 'unknown';
  const ip = getRequestIP({ xForwardedFor: true });

  console.log(`${requestId} <-- ${request.method} ${url.pathname}${url.search}`);
  if (Resource.Dev.value === 'true') {
    const body = await request.clone().text();
    if (body) console.log(`\t\t${body}`);
  }

  console.log(`${requestId} (?) IP: ${ip} | User-Agent: ${userAgent}`);

  const result = await next();

  console.log(`${requestId} --> ${JSON.stringify(result)}`);

  return result;
});
