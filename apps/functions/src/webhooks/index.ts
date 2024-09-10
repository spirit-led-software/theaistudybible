import { handle } from 'hono/aws-lambda';
import { Hono } from 'hono/quick';
import clerk from './clerk';
import stripe from './stripe';

export const app = new Hono().route('/clerk', clerk).route('/stripe', stripe);

export const handler = handle(app);
