import * as schema from '@/core/database/schema';
import { createClient } from '@libsql/client-wasm';
import { drizzle } from 'drizzle-orm/libsql';

export function createLocalDb(options: {
  url: string;
  syncUrl?: string;
  token?: string;
  encryptionKey?: string;
}) {
  const client = createClient({
    url: options.url,
    syncUrl: options.syncUrl,
    authToken: options.token,
    encryptionKey: options.encryptionKey,
  });
  const db = drizzle({ client, schema });
  return { client, db };
}
