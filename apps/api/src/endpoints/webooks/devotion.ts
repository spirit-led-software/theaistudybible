import { generateDevotion } from '@api/lib/devotion';
import type { Bindings, Variables } from '@api/types';
import { Receiver } from '@upstash/qstash/.';
import { Hono } from 'hono';

export const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>().post('/', async (c) => {
  const receiver = new Receiver({
    currentSigningKey: c.env.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: c.env.QSTASH_NEXT_SIGNING_KEY
  });

  const signature = c.req.header('Upstash-Signature');
  if (!signature) {
    return c.json({ message: 'Missing signature header' }, 400);
  }

  const body = await c.req.text();
  const isValid = await receiver.verify({
    body,
    signature,
    url: c.req.url
  });
  if (!isValid) {
    return c.json({ message: 'Invalid signature' }, 400);
  }

  await generateDevotion({
    env: c.env,
    vars: c.var
  });
});

export default app;
