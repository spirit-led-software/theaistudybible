import * as schema from '@/core/database/schema';
import { createClient } from '@libsql/client/web';
import { drizzle } from 'drizzle-orm/libsql';
import { Resource } from 'sst';

export const db = () => {
  const client = createClient({
    url: Resource.Database.url,
    authToken: Resource.Database.token || undefined,
  });
  return drizzle({ client, schema });
};
