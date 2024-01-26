import databaseConfig from '@revelationsai/core/configs/database';
import { withReplicas } from 'drizzle-orm/pg-core';
import { RAIDatabaseConfig } from './config';

export const readWriteDatabaseConfig = new RAIDatabaseConfig({
  connectionString: databaseConfig.readWriteUrl,
  readOnly: false
});

function getDatabase() {
  if (databaseConfig.readWriteUrl !== databaseConfig.readOnlyUrl) {
    const readOnlyDatabaseConfig = new RAIDatabaseConfig({
      connectionString: databaseConfig.readOnlyUrl,
      readOnly: true
    });
    return withReplicas(readWriteDatabaseConfig.database, [readOnlyDatabaseConfig.database]);
  }
  return readWriteDatabaseConfig.database;
}

export const db = getDatabase();
export default db;
