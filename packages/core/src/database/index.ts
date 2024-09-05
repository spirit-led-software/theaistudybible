import * as schema from '@/core/database/schema';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { Resource } from 'sst';

export const db = drizzle(
  createClient({
    url: Resource.Database.url,
    authToken: Resource.Database.token || undefined,
  }),
  {
    schema,
  },
);
