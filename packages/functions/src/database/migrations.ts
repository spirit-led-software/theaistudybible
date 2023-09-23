import config from "@core/configs/database";
import * as schema from "@core/schema";
import type { Handler } from "aws-lambda";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

export const handler: Handler = async () => {
  try {
    console.log(
      "Creating database migration client using url: ",
      config.readWriteUrl
    );

    const migrationClient = drizzle(
      new Pool({
        connectionString: config.readWriteUrl,
        max: 1,
        ssl: true,
      }),
      {
        schema,
        logger: {
          logQuery(query, params) {
            console.log("Executing query:", query, params);
          },
        },
      }
    );

    console.log("Running database migrations...");
    await migrate(migrationClient, {
      migrationsFolder: "migrations",
    });
    console.log("Database migrations complete!");
  } catch (e) {
    console.log(e);
    throw e;
  }
};
