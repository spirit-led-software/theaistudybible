import { databaseConfig, envConfig } from "@core/configs";
import { neon } from "@neondatabase/serverless";
import * as schema from "@revelationsai/core/database/schema";
import { drizzle } from "drizzle-orm/neon-http";

export const readOnlyDatabase = drizzle(neon(databaseConfig.readOnlyUrl), {
  schema,
  logger: envConfig.isLocal,
});

export const readWriteDatabase = drizzle(neon(databaseConfig.readWriteUrl), {
  schema,
  logger: envConfig.isLocal,
});
