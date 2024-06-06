import { RAIDatabaseConfig } from '@theaistudybible/server/lib/database/config';
import { Logger } from 'drizzle-orm';
import { withReplicas } from 'drizzle-orm/pg-core';
import { Resource } from 'sst';

const logger: boolean | Logger = import.meta.env.DEV && {
  logQuery: (query, params) => {
    console.log('===========================================================');
    console.log('Drizzle SQL Query');
    console.log(`Query: ${query}`);
    console.log(`Params: ${JSON.stringify(params)}`);
    console.log('===========================================================');
  }
};

function getDatabase() {
  const readWriteDatabaseConfig = new RAIDatabaseConfig({
    connectionString: Resource.NeonBranch.readWriteUrl,
    readOnly: false,
    logger
  });

  if (
    Resource.NeonBranch.readOnlyUrl !== Resource.NeonBranch.readWriteUrl &&
    Resource.NeonBranch.readOnlyUrl
  ) {
    const readOnlyDatabaseConfig = new RAIDatabaseConfig({
      connectionString: Resource.NeonBranch.readOnlyUrl,
      readOnly: true,
      logger
    });
    return withReplicas(readWriteDatabaseConfig.database, [readOnlyDatabaseConfig.database]);
  }
  return readWriteDatabaseConfig.database;
}

export const db = getDatabase();
