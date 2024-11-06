type Env = {
  API_HOST: string;
  ASSET_HOST: string;
};

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;
    const search = url.search;
    const pathWithParams = pathname + search;

    if (pathname.startsWith('/static/')) {
      const defaultCache = caches.default as Cache;
      let response = await defaultCache.match(request);
      if (!response) {
        response = await fetch(`https://${env.ASSET_HOST}${pathWithParams}`);
        ctx.waitUntil(defaultCache.put(request, response.clone()));
      }
      return addCorsHeaders(response);
    }

    const originRequest = new Request(request);
    originRequest.headers.delete('Cookie');
    const response = await fetch(`https://${env.API_HOST}${pathWithParams}`, originRequest);
    return addCorsHeaders(response);
  },
} satisfies ExportedHandler<Env>;

function addCorsHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
