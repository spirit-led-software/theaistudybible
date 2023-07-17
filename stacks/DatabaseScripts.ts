import { Database, STATIC_ENV_VARS } from "@stacks";
import { Function, Script, StackContext, use } from "sst/constructs";

export function DatabaseMigrations({ stack, app }: StackContext) {
  const { database } = use(Database);

  const dbMigrationsFunction = new Function(stack, "DbMigrations", {
    handler: "packages/functions/src/database/migrations.handler",
    copyFiles: [
      {
        from: "migrations",
      },
    ],
    enableLiveDev: false,
    bind: [database],
    timeout: 60,
  });
  const dbMigrationsScript = new Script(stack, "DbMigrationsScript", {
    onCreate: dbMigrationsFunction,
    onUpdate: dbMigrationsFunction,
  });

  const dbSeedFunction = new Function(stack, "DbSeedFunction", {
    handler: "packages/functions/src/database/seed.handler",
    enableLiveDev: false,
    bind: [database],
    timeout: 60,
    environment: {
      DATABASE_RESOURCE_ARN: database.clusterArn,
      DATABASE_SECRET_ARN: database.secretArn,
      DATABASE_NAME: database.defaultDatabaseName,
      ADMIN_EMAIL: STATIC_ENV_VARS.ADMIN_EMAIL,
    },
  });
  const dbSeedScript = new Script(stack, "DbSeedScript", {
    onCreate: dbSeedFunction,
    onUpdate: dbSeedFunction,
  });
  dbSeedScript.node.addDependency(dbMigrationsScript);

  return {
    dbMigrationsScript,
    dbSeedScript,
  };
}
