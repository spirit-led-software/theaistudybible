import type { Bindings, Variables } from '@/www/server/api/types';
import { Hono } from 'hono/quick';
import { auth } from '../auth';
import adminRoutes from './endpoints/admin';
import bibles from './endpoints/public/bibles';
import dataSources from './endpoints/public/data-sources';
import devotions from './endpoints/public/devotions';
import chat from './endpoints/secure/chat';
import chats from './endpoints/secure/chats';
import generatedImages from './endpoints/secure/generated-images';
import messages from './endpoints/secure/messages';

export const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>()
  .basePath('/api')
  .use('*', async (c, next) => {
    const { session, user, settings, roles } = auth();
    c.set('session', session);
    c.set('user', user);
    c.set('settings', settings);
    c.set('roles', roles);
    await next();
  })
  .notFound((c) => {
    console.error('Route not found');
    return c.json({ message: 'Route not found' }, 404);
  })
  .onError((e, c) => {
    console.error(e);
    return c.json({ message: 'Internal server error', data: e }, 500);
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
  .route('/admin', adminRoutes);
