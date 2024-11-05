type Env = {
  API_HOST: string;
  ASSET_HOST: string;
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const search = url.search;
    const pathWithParams = pathname + search;

    if (pathname.startsWith('/static/')) {
      // @ts-ignore - idk why vscode is complaining
      const defaultCache = caches.default as Cache;
      let response = await defaultCache.match(request);
      if (!response) {
        response = await fetch(`https://${env.ASSET_HOST}${pathWithParams}`);
        ctx.waitUntil(defaultCache.put(request, response.clone()));
      }
      return response;
    }

    const originRequest = new Request(request);
    originRequest.headers.delete('cookie');
    return await fetch(`https://${env.API_HOST}${pathWithParams}`, originRequest);
  },
} satisfies ExportedHandler<Env>;
