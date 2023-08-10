import config from "@core/configs/database";
import { neon } from "@neondatabase/serverless";
import * as schema from "@revelationsai/core/database/schema";
import { Handler } from "aws-lambda";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

export const handler: Handler = async () => {
  try {
    console.log("Creating database migration client...");
    const migration = drizzle(neon(config.writeUrl), {
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
