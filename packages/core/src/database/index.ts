import * as schema from '@/core/database/schema';
import { type Client, createClient } from '@libsql/client';
import * as Sentry from '@sentry/node';
import { type LibSQLDatabase, drizzle } from 'drizzle-orm/libsql';
import { libsqlIntegration } from 'sentry-integration-libsql-client';
import { Resource } from 'sst';

export type DbType = LibSQLDatabase<typeof schema> & {
  $client: Client;
};

const dbMap = new WeakMap<{ id: string }, DbType>();

export const db = (id?: string) => {
  let client: Client;
  if (id) {
    const db = dbMap.get({ id });
    if (db) {
      return db;
    }

    if (id === 'schema') {
      client = createClient({
        url: Resource.TursoDatabaseSchema.url,
        authToken: Resource.TursoGroupToken.value,
      });
    } else {
      client = createClient({
        url: `${id}-${Resource.TursoOrg.value}.turso.io`,
        authToken: Resource.TursoGroupToken.value,
      });
    }
  } else {
    client = createClient({
      url: Resource.SharedTursoDatabase.url,
      authToken: Resource.SharedTursoDatabase.token || undefined,
    });
  }
  Sentry.addIntegration(libsqlIntegration(client, Sentry));
  const db = drizzle({ client, schema });
  dbMap.set({ id: id ?? 'shared' }, db);
  return db;
};
