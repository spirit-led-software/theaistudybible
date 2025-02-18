import * as schema from '@/core/database/schema';
import { type Client, createClient } from '@libsql/client/web';
import { type LibSQLDatabase, drizzle } from 'drizzle-orm/libsql';
import { Resource } from 'sst';

let currentDB:
  | (LibSQLDatabase<typeof schema> & {
      $client: Client;
    })
  | undefined;

export const db = () => {
  if (!currentDB) {
    const client = createClient({
      url: Resource.Database.url,
      authToken: Resource.Database.token || undefined,
    });
    currentDB = drizzle({ client, schema });
  }
  return currentDB;
};
