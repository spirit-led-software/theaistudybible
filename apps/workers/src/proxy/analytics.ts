type Env = {
  API_HOST: string;
  ASSET_HOST: string;
};

async function handleRequest(request: Request, env: Env, ctx: ExecutionContext) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const search = url.search;
  const pathWithParams = pathname + search;

  if (pathname.startsWith('/static/')) {
    return await retrieveStatic(request, env, ctx, pathWithParams);
  }
  return await forwardRequest(request, env, pathWithParams);
}

async function retrieveStatic(request: Request, env: Env, ctx: ExecutionContext, pathname: string) {
  let response = await caches.default.match(request);
  if (!response) {
    response = await fetch(`${env.ASSET_HOST}${pathname}`);
    ctx.waitUntil(caches.default.put(request, response.clone()));
  }
  return response;
}

async function forwardRequest(request: Request, env: Env, pathWithSearch: string) {
  const originRequest = new Request(request);
  originRequest.headers.delete('cookie');
  return await fetch(`${env.API_HOST}${pathWithSearch}`, originRequest);
}

export default {
  async fetch(request, env, ctx) {
    return await handleRequest(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
