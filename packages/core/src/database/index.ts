import { RDSDataClient } from "@aws-sdk/client-rds-data";
import { drizzle as drizzleAws } from "drizzle-orm/aws-data-api/pg";
import { drizzle as drizzleLocal } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import config from "../configs/database";
import * as schema from "./schema";

export const db =
  config.isLocal && config.url
    ? drizzleLocal(postgres(config.url), {
        schema,
      })
    : drizzleAws(new RDSDataClient({}), {
        resourceArn: config.resourceArn!,
        secretArn: config.secretArn!,
        database: config.database!,
        schema,
      });
