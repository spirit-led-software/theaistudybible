import * as schema from '@/core/database/schema';
import { createClient } from '@libsql/client';
import * as Sentry from '@sentry/node';
import { drizzle } from 'drizzle-orm/libsql';
import { libsqlIntegration } from 'sentry-integration-libsql-client';
import { Resource } from 'sst';

const client = createClient({
  url: Resource.Database.url,
  authToken: Resource.Database.token || undefined,
});

Sentry.addIntegration(libsqlIntegration(client, Sentry));

export const db = drizzle({ client, schema });
