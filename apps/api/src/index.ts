import adminRoutes from '@api/endpoints/admin';
import webhooks from '@api/endpoints/webooks';
import type { Bindings, Variables } from '@api/types';
import { clerkMiddleware } from '@hono/clerk-auth';
import { sentry } from '@hono/sentry';
import { Ratelimit } from '@upstash/ratelimit';
import { Hono } from 'hono';
import { handle } from 'hono/aws-lambda';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import bibles from './endpoints/public/bibles';
import dataSources from './endpoints/public/data-sources';
import devotions from './endpoints/public/devotions';
import chat from './endpoints/secure/chat';
import chats from './endpoints/secure/chats';
import generatedImages from './endpoints/secure/generated-images';
import messages from './endpoints/secure/messages';
import { cache } from './lib/cache';
import { client } from './lib/database';

export const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>()
  .use('*', logger())
  .use('*', cors())
  .use(
    '*',
    sentry({
      dsn: 'https://8f8843759a63e1580a37e607f2c845d6@o4507103632359424.ingest.us.sentry.io/4507124309622784'
    })
  )
  .use('*', async (c, next) => {
    const ratelimit = new Ratelimit({
      redis: cache,
      limiter: Ratelimit.slidingWindow(100, '1 s'),
      analytics: true,
      prefix: 'ratelimit:api'
    });
    const result = await ratelimit.limit(
      c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'api'
    );
    if (!result.success) {
      const reset = new Date(result.reset);
      const timeRemaining = reset.getTime() - new Date().getTime();
      return c.json(
        {
          message: `Maximum number of requests exceeded (${result.limit}). Please try again in ${timeRemaining} ms.`
        },
        429
      );
    }

    await next();
  })
  .use('*', async (c, next) => {
    await client.connect();
    await next();
    if (c.req.path !== '/chat') {
      await client.end();
    }
  })
  .use(
    '*',
    async (c, next) =>
      await clerkMiddleware({
        publishableKey: process.env.PUBLIC_CLERK_PUBLISHABLE_KEY,
        secretKey: process.env.CLERK_SECRET_KEY
      })(c, next)
  )
  .notFound((c) => {
    return c.json(
      {
        message: 'Route not found'
      },
      404
    );
  })
  .onError((e, c) => {
    console.error(e);
    c.get('sentry').captureException(e);
    return c.json(
      {
        message: 'Internal server error',
        data: e
      },
      500
    );
  });

const routes = app
  // Public routes
  .route('/bibles', bibles)
  .route('/data-sources', dataSources)
  .route('/devotions', devotions)
  // Secure routes
  .route('/chat', chat)
  .route('/chats', chats)
  .route('/generated-images', generatedImages)
  .route('/messages', messages)
  // Other routes
  .route('/admin', adminRoutes)
  .route('/webhooks', webhooks);
export type RouterType = typeof routes;

export const handler = handle(app);
