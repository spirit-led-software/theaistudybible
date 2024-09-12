import * as schema from '@/core/database/schema';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { Resource } from 'sst';

async function dbFetch(request: Request) {
  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const { url, ...options } = request;
      const response = await fetch(url, options);
      if (response.ok) return response;
      throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      retries++;
      if (retries === maxRetries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
    }
  }
  throw new Error('Failed to fetch');
}

const client = createClient({
  url: Resource.Database.url,
  authToken: Resource.Database.token || undefined,
  fetch: dbFetch,
});

export const db = drizzle(client, {
  schema,
});
