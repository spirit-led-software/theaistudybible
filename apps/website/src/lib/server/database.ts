import { building } from '$app/environment';
import { DATABASE_READONLY_URL, DATABASE_READWRITE_URL } from '$env/static/private';
import { RAIDatabaseConfig } from '@theaistudybible/core/database/config';
import { withReplicas } from 'drizzle-orm/pg-core';

function getDatabase() {
  const readWriteDatabaseConfig = new RAIDatabaseConfig({
    connectionString: DATABASE_READWRITE_URL,
    readOnly: false
  });

  if (DATABASE_READWRITE_URL !== DATABASE_READONLY_URL && DATABASE_READONLY_URL) {
    const readOnlyDatabaseConfig = new RAIDatabaseConfig({
      connectionString: DATABASE_READONLY_URL,
      readOnly: true
    });
    return withReplicas(readWriteDatabaseConfig.database, [readOnlyDatabaseConfig.database]);
  }
  return readWriteDatabaseConfig.database;
}

export let db: ReturnType<typeof getDatabase>;
if (!building) {
  db = getDatabase();
}
