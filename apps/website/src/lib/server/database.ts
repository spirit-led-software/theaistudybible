import { building } from "$app/environment";
import { RAIDatabaseConfig } from "@revelationsai/server/lib/database/config";
import { withReplicas } from "drizzle-orm/pg-core";

export let readWriteDatabaseConfig: RAIDatabaseConfig;
if (!building) {
  readWriteDatabaseConfig = new RAIDatabaseConfig({
    connectionString: process.env.DATABASE_READWRITE_URL,
    readOnly: false,
  });
}

function getDatabase() {
  if (
    process.env.DATABASE_READWRITE_URL !== process.env.DATABASE_READONLY_URL
  ) {
    const readOnlyDatabaseConfig = new RAIDatabaseConfig({
      connectionString: process.env.DATABASE_READONLY_URL,
      readOnly: true,process.env.
    });
    return withReplicas(readWriteDatabaseConfig.database, [
      readOnlyDatabaseConfig.database,
    ]);
  }
  return readWriteDatabaseConfig.database;
}

export let db: ReturnType<typeof getDatabase>;
if (!building) {
  db = getDatabase();
}
