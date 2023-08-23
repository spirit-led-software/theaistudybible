import { databaseConfig, envConfig } from "@core/configs";
import * as schema from "@core/database/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export const readOnlyDatabase = drizzle(
  new Pool({
    connectionString: databaseConfig.readOnlyUrl,
    max: 20,
    ssl: true,
  }),
  {
    schema,
    logger: envConfig.isLocal,
  }
);

export const readWriteDatabase = drizzle(
  new Pool({
    connectionString: databaseConfig.readWriteUrl,
    max: 20,
    ssl: true,
  }),
  {
    schema,
    logger: envConfig.isLocal,
  }
);
