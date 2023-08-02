import { RDSDataClient } from "@aws-sdk/client-rds-data";
import * as schema from "@revelationsai/core/database/schema";
import { Handler } from "aws-lambda";
import { sql } from "drizzle-orm";
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

    /*
    If Migrations are not running, run the following query on the RDS to delete the
    drizzle_migrations table:
    
    drop table "drizzle"."__drizzle_migrations";
    drop schema "drizzle;
    */

    // TODO: Delete this when drizzle fixes migrations
    console.log("Dropping database migrations table...");
    await migration.execute(sql`
      drop table "drizzle"."__drizzle_migrations";
      drop schema "drizzle;
    `);

    console.log("Running database migrations...");
    await migrate(migration, {
      migrationsFolder: "migrations",
      migrationsTable: "drizzle_migrations",
    });
    console.log("Database migrations complete!");
  } catch (e) {
    console.log(e);
    throw e;
  }
};
