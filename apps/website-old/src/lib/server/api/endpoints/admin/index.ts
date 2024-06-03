import type { Bindings, Variables } from '$lib/server/api/types';
import { hasRole } from '@theaistudybible/server/lib/user';
import { Hono } from 'hono';
import bibles from './bibles';
import chats from './chats';
import dataSources from './data-sources';
import devotions from './devotions';
import scraper from './scraper';

export const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>()
  .use('/*', async (c, next) => {
    if (
      process.env.NODE_ENV !== 'development' &&
      (!c.var.clerkAuth?.userId || !hasRole('admin', c.var.clerkAuth.sessionClaims))
    ) {
      return c.json(
        {
          message: 'You must be an admin to access this resource.'
        },
        401
      );
    }
    await next();
  })
  .route('/bibles', bibles)
  .route('/chats', chats)
  .route('/data-sources', dataSources)
  .route('/devotions', devotions)
  .route('/scraper', scraper);

export default app;
