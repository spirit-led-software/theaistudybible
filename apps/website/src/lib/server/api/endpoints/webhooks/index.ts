import { Hono } from 'hono';
import type { Bindings, Variables } from '../../types';
import clerk from './clerk';
import revenueCat from './revenue-cat';
import stripe from './stripe';

export const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>()
  .route('/clerk', clerk)
  .route('/revenue-cat', revenueCat)
  .route('/stripe', stripe);

export default app;
