import { databaseConfig, envConfig } from "@core/configs";
import * as schema from "@core/database/schema";
import {
  neon,
  neonConfig,
  type NeonQueryFunction,
} from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

export type RAIDatabaseConfigInput = {
  readOnly?: boolean;
  connectionString: string;
};

export class RAIDatabaseConfig {
  queryFn: NeonQueryFunction<false, false>;
  database: NeonHttpDatabase<typeof schema>;

  constructor({ readOnly, connectionString }: RAIDatabaseConfigInput) {
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

export const readOnlyDatabase = new RAIDatabaseConfig({
  readOnly: true,
  connectionString: databaseConfig.readOnlyUrl,
}).database;

export const readWriteDatabase = new RAIDatabaseConfig({
  readOnly: false,
  connectionString: databaseConfig.readWriteUrl,
}).database;

export default {
  readOnlyDatabase,
  readWriteDatabase,
};
