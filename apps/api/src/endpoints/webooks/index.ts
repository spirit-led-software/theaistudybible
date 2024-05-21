import type { Bindings, Variables } from '@api/types';
import { Hono } from 'hono';
import clerk from './clerk';
import devotion from './devotion';
import scraper from './scraper';

export const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>()
  .route('/clerk', clerk)
  .route('/devotion', devotion)
  .route('/scraper', scraper);

export default app;
