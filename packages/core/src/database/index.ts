import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { databaseConfig, envConfig } from "../configs";
import * as schema from "./schema";

export const readDatabase = drizzle(neon(databaseConfig.readUrl), {
  schema,
  logger: envConfig.isLocal,
});

export const writeDatabase = drizzle(neon(databaseConfig.writeUrl), {
  schema,
  logger: envConfig.isLocal,
});
