import { cache } from '@/core/cache';
import { db } from '@/core/database';
import type { APIHandler } from '@solidjs/start/server';

export const GET: APIHandler = async () => {
  const dbTest = await db.$client
    .execute('SELECT 1;')
    .then(() => undefined)
    .catch((e) => e);
  const cacheTest = await cache
    .touch('test')
    .then(() => undefined)
    .catch((e) => e);
  const isHealthy = dbTest === undefined && cacheTest === undefined;
  return Response.json(
    {
      status: {
        db: dbTest,
        cache: cacheTest,
      },
    },
    { status: isHealthy ? 200 : 500 },
  );
};
