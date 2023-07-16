import { migration } from "@chatesv/core/database";
import { Handler } from "aws-lambda";
import { migrate } from "drizzle-orm/postgres-js/migrator";

export const handler: Handler = async (event, _) => {
  try {
    migrate(migration, {
      migrationsFolder: "./migrations",
    });
  } catch (e) {
    console.log(e);
    throw e;
  }
};
