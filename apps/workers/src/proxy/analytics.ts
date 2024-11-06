type Env = {
  API_HOST: string;
  ASSET_HOST: string;
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const pathWithParams = `${pathname}${url.search}`;
    if (pathname.startsWith('/static/')) {
      const defaultCache = caches.default as Cache;
      let response = await defaultCache.match(request);
      if (!response) {
        response = await fetch(`${env.ASSET_HOST}${pathWithParams}`);
        ctx.waitUntil(defaultCache.put(request, response.clone()));
      }
      return response;
    }
    return await fetch(`${env.API_HOST}${pathWithParams}`, request);
  },
} satisfies ExportedHandler<Env>;
