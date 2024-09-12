import * as schema from '@/core/database/schema';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { Resource } from 'sst';

async function dbFetch(input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) {
  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const response = await fetch(input, init);
      if (response.ok) return response;
      throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      retries++;
      if (retries === maxRetries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
    }
  }
}

const client = createClient({
  url: Resource.Database.url,
  authToken: Resource.Database.token || undefined,
  fetch: dbFetch,
});

export const db = drizzle(client, {
  schema,
});
