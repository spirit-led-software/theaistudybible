import { Hono } from 'hono';
import type { Bindings, Variables } from '../../types';
import clerk from './clerk';
import stripe from './stripe';

export const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>()
  .route('/clerk', clerk)
  .route('/stripe', stripe);

export default app;
