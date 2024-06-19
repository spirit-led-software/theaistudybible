import * as schema from '@theaistudybible/core/database/schema';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20
});

export const db = drizzle(pool, {
  schema
});
