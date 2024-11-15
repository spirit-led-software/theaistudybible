import { wrapHandler } from '@sentry/aws-serverless';
import { handle } from 'hono/aws-lambda';
import { Hono } from 'hono/quick';
import stripe from './stripe';

export const app = new Hono().route('/stripe', stripe);

export const handler = wrapHandler(handle(app));
