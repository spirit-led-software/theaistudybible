import type { APIHandler } from '@solidjs/start/server';

export const HEAD: APIHandler = () => {
  return Promise.resolve(new Response('pong', { status: 200 }));
};
