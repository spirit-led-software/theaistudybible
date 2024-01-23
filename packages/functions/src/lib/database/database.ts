import databaseConfig from '@core/configs/database';
import polyScaleConfig from '@core/configs/poly-scale';
import { withReplicas } from 'drizzle-orm/pg-core';
import { RAIDatabaseConfig } from './config';

export const readWriteDatabaseConfig = new RAIDatabaseConfig({
  connectionString: databaseConfig.readWriteUrl,
  readOnly: false,
  polyScaleAppId: polyScaleConfig.appId
});

function getDatabase() {
  if (databaseConfig.readWriteUrl !== databaseConfig.readOnlyUrl) {
    const readOnlyDatabaseConfig = new RAIDatabaseConfig({
      connectionString: databaseConfig.readOnlyUrl,
      readOnly: true,
      polyScaleAppId: polyScaleConfig.appId
    });
    return withReplicas(readWriteDatabaseConfig.database, [readOnlyDatabaseConfig.database]);
  }
  return readWriteDatabaseConfig.database;
}

export const db = getDatabase();
export default db;
