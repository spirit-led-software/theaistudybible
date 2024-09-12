import * as schema from '@/core/database/schema';
import { createClient as createTcpClient } from '@libsql/client';
import { createClient as createWebClient } from '@libsql/client/web';
import { drizzle } from 'drizzle-orm/libsql';
import { Resource } from 'sst';

export const db = drizzle(
  Resource.Database.url.startsWith('file')
    ? createTcpClient({
        url: Resource.Database.url,
      })
    : createWebClient({
        url: Resource.Database.url,
        authToken: Resource.Database.token,
      }),
  {
    schema,
  },
);
