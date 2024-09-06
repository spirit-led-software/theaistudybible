import type { Bindings, Variables } from '@/www/server/api/types';
import { clerkMiddleware } from '@hono/clerk-auth';
import { logger } from 'hono/logger';
import { Hono } from 'hono/quick';
import { Resource } from 'sst';
import adminRoutes from './endpoints/admin';
import bibles from './endpoints/public/bibles';
import dataSources from './endpoints/public/data-sources';
import devotions from './endpoints/public/devotions';
import chat from './endpoints/secure/chat';
import chats from './endpoints/secure/chats';
import generatedImages from './endpoints/secure/generated-images';
import messages from './endpoints/secure/messages';
import webhooks from './endpoints/webhooks';

export const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>()
  .basePath('/api')
  .use('*', logger())
  .use(
    '*',
    clerkMiddleware({
      publishableKey: Resource.ClerkPublishableKey.value,
      secretKey: Resource.ClerkSecretKey.value,
    }),
  )
  .notFound((c) => {
    console.error('Route not found');
    return c.json(
      {
        message: 'Route not found',
      },
      404,
    );
  })
  .onError((e, c) => {
    console.error(e);
    return c.json(
      {
        message: 'Internal server error',
        data: e,
      },
      500,
    );
  })
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
