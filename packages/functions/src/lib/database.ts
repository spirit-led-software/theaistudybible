import { databaseConfig, envConfig } from "@core/configs";
import * as schema from "@core/database/schema";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

export const readOnlyDatabase = drizzle(neon(databaseConfig.readOnlyUrl), {
  schema,
  logger: envConfig.isLocal,
});

export const readWriteDatabase = drizzle(neon(databaseConfig.readWriteUrl), {
  schema,
  logger: envConfig.isLocal,
});

export default {
  readOnlyDatabase,
  readWriteDatabase,
};
