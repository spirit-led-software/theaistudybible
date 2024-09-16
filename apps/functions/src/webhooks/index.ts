import { handle } from 'hono/aws-lambda';
import { Hono } from 'hono/quick';
import stripe from './stripe';

export const app = new Hono().route('/stripe', stripe);

export const handler = handle(app);
