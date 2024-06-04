import { RAIDatabaseConfig } from '@theaistudybible/server/lib/database/config';
import { withReplicas } from 'drizzle-orm/pg-core';
import { Resource } from 'sst';

export const readWriteDatabaseConfig = new RAIDatabaseConfig({
  connectionString: Resource.NeonBranch.readWriteUrl,
  readOnly: false
});

function getDatabase() {
  if (
    Resource.NeonBranch.readOnlyUrl !== Resource.NeonBranch.readWriteUrl &&
    Resource.NeonBranch.readOnlyUrl
  ) {
    const readOnlyDatabaseConfig = new RAIDatabaseConfig({
      connectionString: Resource.NeonBranch.readOnlyUrl,
      readOnly: true
    });
    return withReplicas(readWriteDatabaseConfig.database, [readOnlyDatabaseConfig.database]);
  }
  return readWriteDatabaseConfig.database;
}

export const db = getDatabase();
