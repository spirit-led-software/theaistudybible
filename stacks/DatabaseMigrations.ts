import { Database } from "@stacks";
import { Function, Script, StackContext, use } from "sst/constructs";

export function DatabaseMigrations({ stack, app }: StackContext) {
  const { databaseUrl } = use(Database);

  // run migrations
  const dbMigrationsFunction = new Function(stack, "DbMigrations", {
    handler: "packages/functions/src/migrations.handler",
    environment: {
      DATABASE_URL: databaseUrl,
    },
    copyFiles: [
      {
        from: "migrations",
      },
    ],
    enableLiveDev: false,
  });

  const dbMigrationsScript = new Script(stack, "DbMigrationsScript", {
    onCreate: dbMigrationsFunction,
    onUpdate: dbMigrationsFunction,
  });

  return {
    dbMigrationsFunction,
    dbMigrationsScript,
  };
}
