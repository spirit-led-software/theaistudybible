import * as schema from '@/core/database/schema';
import { createClient } from '@libsql/client/web';
import { drizzle } from 'drizzle-orm/libsql';
import { Resource } from 'sst';

const client = createClient({
  url: Resource.Database.url,
  authToken: Resource.Database.token,
});

export const db = drizzle(client, {
  schema,
});

process.on('beforeExit', () => {
  client.close();
});
