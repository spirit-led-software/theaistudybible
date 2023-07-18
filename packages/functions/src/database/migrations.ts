import { RDSDataClient } from "@aws-sdk/client-rds-data";
import * as schema from "@chatesv/core/database/schema";
import { Handler } from "aws-lambda";
import { drizzle } from "drizzle-orm/aws-data-api/pg";
import { migrate } from "drizzle-orm/aws-data-api/pg/migrator";
import { RDS } from "sst/node/rds";

export const handler: Handler = async (event, _) => {
  try {
    const migration = drizzle(new RDSDataClient({}), {
      resourceArn: RDS.database.clusterArn,
      secretArn: RDS.database.secretArn,
      database: RDS.database.defaultDatabaseName,
      schema,
    });
    await migrate(migration, {
      migrationsFolder: "./migrations",
    });
  } catch (e) {
    console.log(e);
    throw e;
  }
};
