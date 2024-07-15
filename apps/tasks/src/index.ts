import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { HonoAdapter } from '@bull-board/hono';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { tasksQueue } from './queues';

import './tasks';
import './workers';

const app = new Hono({
  strict: false
});

const serverAdapter = new HonoAdapter(serveStatic);
createBullBoard({
  queues: [new BullMQAdapter(tasksQueue)],
  serverAdapter
});
const basePath = '/dashboard';
serverAdapter.setBasePath(basePath);
app.route(basePath, serverAdapter.registerPlugin());

export default {
  port: 4000,
  fetch: app.fetch
};
