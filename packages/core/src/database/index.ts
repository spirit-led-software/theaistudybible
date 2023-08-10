import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { databaseConfig, envConfig } from "../configs";
import * as schema from "./schema";

neonConfig.fetchConnectionCache = true;

export const readDatabase = drizzleNeon(neon(databaseConfig.readUrl), {
  schema,
  logger: envConfig.isLocal,
});

export const writeDatabase = drizzleNeon(neon(databaseConfig.writeUrl), {
  schema,
  logger: envConfig.isLocal,
});
