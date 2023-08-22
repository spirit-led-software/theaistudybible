import { databaseConfig, envConfig } from "@core/configs";
import * as schema from "@revelationsai/core/database/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export const readOnlyDatabase = drizzle(
  postgres(databaseConfig.readOnlyUrl, {
    ssl: true,
  }),
  {
    schema,
    logger: envConfig.isLocal,
  }
);

export const readWriteDatabase = drizzle(
  postgres(databaseConfig.readWriteUrl, {
    ssl: true,
  }),
  {
    schema,
    logger: envConfig.isLocal,
  }
);
