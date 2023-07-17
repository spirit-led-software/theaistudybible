import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import config from "../configs/database";
import * as schema from "./schema";

export const db = drizzle(postgres(config.url), {
  schema,
});

export const migration = drizzle(
  postgres(config.url, {
    max: 1,
  }),
  {
    schema,
  }
);
