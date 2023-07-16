import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import config from "../configs/database";
import * as schema from "./schema";

const dbClient = postgres(config.url, {
  prepare: false,
});
export const db = drizzle(dbClient, {
  schema,
});

const migrationClient = postgres(config.url, {
  max: 1,
  prepare: false,
});
export const migration = drizzle(migrationClient, {
  schema,
});
