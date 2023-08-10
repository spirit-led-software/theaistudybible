import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { databaseConfig, envConfig } from "../configs";
import * as schema from "./schema";

export const readOnlyDatabase = drizzle(neon(databaseConfig.readOnlyUrl), {
  schema,
  logger: envConfig.isLocal,
});

export const readWriteDatabase = drizzle(neon(databaseConfig.readWriteUrl), {
  schema,
  logger: envConfig.isLocal,
});
