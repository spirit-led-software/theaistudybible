import config from "@core/configs/database";
import * as schema from "@core/schema";
import { Handler } from "aws-lambda";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

export const handler: Handler = async () => {
  try {
    console.log(
      "Creating database migration client using url: ",
      config.readWriteUrl
    );

    const migration = drizzle(
      postgres(config.readWriteUrl, {
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
    await migrate(migration, {
      migrationsFolder: "migrations",
    });
    console.log("Database migrations complete!");
  } catch (e) {
    console.log(e);
    throw e;
  }
};
