import type { Bindings, Variables } from '@/api/types';
import { hasRole } from '@/core/user';
import { Hono } from 'hono';
import { Resource } from 'sst';
import bibles from './bibles';
import chats from './chats';
import dataSources from './data-sources';
import devotions from './devotions';

export const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>()
  .use('/*', async (c, next) => {
    if (
      Resource.Stage.value !== 'development' &&
      (!c.var.clerkAuth?.userId || !hasRole('admin', c.var.clerkAuth.sessionClaims))
    ) {
      return c.json(
        {
          message: 'You must be an admin to access this resource.',
        },
        401,
      );
    }
    await next();
  })
  .route('/bibles', bibles)
  .route('/chats', chats)
  .route('/data-sources', dataSources)
  .route('/devotions', devotions);

export default app;
