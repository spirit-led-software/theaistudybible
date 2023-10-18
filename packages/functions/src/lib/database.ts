import { databaseConfig, envConfig } from "@core/configs";
import * as schema from "@core/database/schema";
import {
  neon,
  neonConfig,
  type NeonQueryFunction,
} from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

export type RAIDatabaseConfigInput = {
  connectionString: string;
  readOnly?: boolean;
};

export class RAIDatabaseConfig {
  queryFn: NeonQueryFunction<false, false>;
  database: NeonHttpDatabase<typeof schema>;

  constructor({ connectionString, readOnly }: RAIDatabaseConfigInput) {
    neonConfig.fetchConnectionCache = true;
    this.queryFn = neon(connectionString, {
      readOnly,
    });
    this.database = drizzle(this.queryFn, {
      schema,
      logger: envConfig.isLocal,
    });
  }
}

export const readOnlyDatabaseConfig = new RAIDatabaseConfig({
  connectionString: databaseConfig.readOnlyUrl,
  readOnly: true,
});
export const readOnlyDatabase = readOnlyDatabaseConfig.database;

export const readWriteDatabaseConfig = new RAIDatabaseConfig({
  connectionString: databaseConfig.readWriteUrl,
  readOnly: false,
});
export const readWriteDatabase = readWriteDatabaseConfig.database;

export default {
  readOnlyDatabase,
  readWriteDatabase,
};
