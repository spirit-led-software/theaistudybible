type Env = {
  API_HOST: string;
  ASSET_HOST: string;
};

export default {
  async fetch(request, env, ctx) {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;
    const search = url.search;
    const pathWithParams = pathname + search;

    let response: Response | undefined;
    if (pathname.startsWith('/static/')) {
      const defaultCache = caches.default as Cache;
      response = await defaultCache.match(request);
      if (!response) {
        response = await fetch(`https://${env.ASSET_HOST}${pathWithParams}`);
        ctx.waitUntil(defaultCache.put(request, response.clone()));
      }
    } else {
      const originRequest = new Request(request);
      originRequest.headers.delete('Cookie');
      response = await fetch(`https://${env.API_HOST}${pathWithParams}`, originRequest);
    }

    // Add CORS headers to all responses
    const corsHeaders = new Headers(response.headers);
    corsHeaders.set('Access-Control-Allow-Origin', '*');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: corsHeaders,
    });
  },
} satisfies ExportedHandler<Env>;
