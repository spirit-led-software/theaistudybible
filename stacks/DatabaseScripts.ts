import { Database, STATIC_ENV_VARS } from "@stacks";
import { Function, Script, StackContext, use } from "sst/constructs";

export function DatabaseMigrations({ stack }: StackContext) {
  const { database } = use(Database);

  const dbMigrationsFunction = new Function(stack, "dbMigrationsFunction", {
    handler: "packages/functions/src/database/migrations.handler",
    copyFiles: [
      {
        from: "migrations",
      },
    ],
    enableLiveDev: false,
    bind: [database],
  });
  const dbMigrationsScript = new Script(stack, "dbMigrationsScript", {
    onCreate: dbMigrationsFunction,
    onUpdate: dbMigrationsFunction,
  });

  const dbSeedFunction = new Function(stack, "dbSeedFunction", {
    handler: "packages/functions/src/database/seed.handler",
    enableLiveDev: false,
    bind: [database],
    environment: {
      DATABASE_RESOURCE_ARN: database.clusterArn,
      DATABASE_SECRET_ARN: database.secretArn,
      DATABASE_NAME: database.defaultDatabaseName,
      ...STATIC_ENV_VARS,
    },
  });
  const dbSeedScript = new Script(stack, "dbSeedScript", {
    onCreate: dbSeedFunction,
    onUpdate: dbSeedFunction,
  });
  dbSeedScript.node.addDependency(dbMigrationsScript);

  return {
    dbMigrationsScript,
    dbSeedScript,
  };
}
