import * as schema from '@core/database/schema';
import { Client as NeonClient } from '@neondatabase/serverless';
import { drizzle as neonDrizzle } from 'drizzle-orm/neon-serverless';

export const client = new NeonClient(process.env.DATABASE_URL);
export const db = neonDrizzle(client, {
  schema,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  logger: env.ENVIRONMENT !== 'production'
});
