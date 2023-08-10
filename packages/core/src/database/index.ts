import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzleLocal } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { databaseConfig, envConfig } from "../configs";
import * as schema from "./schema";

neonConfig.fetchConnectionCache = true;

export const readDatabase = envConfig.isLocal
  ? drizzleLocal(postgres(databaseConfig.readUrl), {
      schema,
      logger: {
        logQuery(query, params) {
          console.log("Executing query:", query, params);
        },
      },
    })
  : drizzleNeon(neon(databaseConfig.readUrl), {
      schema,
    });

export const writeDatabase = envConfig.isLocal
  ? drizzleLocal(postgres(databaseConfig.writeUrl), {
      schema,
      logger: {
        logQuery(query, params) {
          console.log("Executing query:", query, params);
        },
      },
    })
  : drizzleNeon(neon(databaseConfig.writeUrl), {
      schema,
    });
