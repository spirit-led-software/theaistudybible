import config from "@core/configs/database";
import { neon, neonConfig } from "@neondatabase/serverless";
import * as schema from "@revelationsai/core/database/schema";
import { Handler } from "aws-lambda";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

export const handler: Handler = async () => {
  try {
    console.log("Creating database migration client...");
    neonConfig.fetchConnectionCache = true;
    const migration = drizzle(neon(config.url), {
      schema,
      logger: {
        logQuery(query, params) {
          console.log("Executing query:", query, params);
        },
      },
    });

    console.log("Running database migrations...");
    await migrate(migration, {
      migrationsFolder: "migrations",
    });
    console.log("Database migrations complete!");
  } catch (e) {
    console.log(e);
    throw e;
  }
};
