import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzleLocal } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import config from "../configs/database";
import * as schema from "./schema";

neonConfig.fetchConnectionCache = true;

export const db = config.isLocal
  ? drizzleLocal(postgres(config.url!), {
      schema,
    })
  : drizzleNeon(neon(config.url!));
