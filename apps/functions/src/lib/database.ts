import { RAIDatabaseConfig } from '@theaistudybible/core/database/config';
import { withReplicas } from 'drizzle-orm/pg-core';

export const readWriteDatabaseConfig = new RAIDatabaseConfig({
  connectionString: process.env.DATABASE_READWRITE_URL,
  readOnly: false
});

function getDatabase() {
  if (
    process.env.DATABASE_READWRITE_URL !== process.env.DATABASE_READONLY_URL &&
    process.env.DATABASE_READONLY_URL
  ) {
    const readOnlyDatabaseConfig = new RAIDatabaseConfig({
      connectionString: process.env.DATABASE_READONLY_URL,
      readOnly: true
    });
    return withReplicas(readWriteDatabaseConfig.database, [readOnlyDatabaseConfig.database]);
  }
  return readWriteDatabaseConfig.database;
}

export const db = getDatabase();
