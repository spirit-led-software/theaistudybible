import type { APIHandler } from '@solidjs/start/server';

export const GET: APIHandler = () => {
  return Promise.resolve(Response.json({ status: 'healthy' }, { status: 200 }));
};
