import * as schema from '@/core/database/schema';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { Resource } from 'sst';

const MAX_RETRIES = 5;
const BASE_DELAY = 1000;

async function dbFetch(request: Request, remainingRetries = MAX_RETRIES) {
  const clonedRequest = request.clone();
  try {
    const response = await fetch(clonedRequest);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  } catch (error) {
    if (remainingRetries <= 0) {
      throw error;
    }
    const delay = BASE_DELAY * 2 ** (MAX_RETRIES - remainingRetries);
    console.log(`[DB] Retry ${MAX_RETRIES - remainingRetries + 1} after ${delay}ms`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return await dbFetch(request, remainingRetries - 1);
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
