import * as schema from '@/core/database/schema';
import * as Sentry from '@sentry/node';
import { drizzle } from 'drizzle-orm/libsql/web';
import { libsqlIntegration } from 'sentry-integration-libsql-client';
import { Resource } from 'sst';

export const db = drizzle({
  connection: { url: Resource.Database.url, authToken: Resource.Database.token || undefined },
  schema,
});

Sentry.addIntegration(libsqlIntegration(db.$client, Sentry));
