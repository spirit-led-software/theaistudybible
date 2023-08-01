import { RDSDataClient } from "@aws-sdk/client-rds-data";
import * as schema from "@revelationsai/core/database/schema";
import { Handler } from "aws-lambda";
import { drizzle } from "drizzle-orm/aws-data-api/pg";
import { migrate } from "drizzle-orm/aws-data-api/pg/migrator";
import { RDS } from "sst/node/rds";

export const handler: Handler = async () => {
  try {
    console.log("Creating database migration client...");
    const migration = drizzle(new RDSDataClient({}), {
      resourceArn: RDS.database.clusterArn,
      secretArn: RDS.database.secretArn,
      database: RDS.database.defaultDatabaseName,
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
