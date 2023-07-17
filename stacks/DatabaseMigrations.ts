import { Database } from "@stacks";
import { Function, Script, StackContext, use } from "sst/constructs";

export function DatabaseMigrations({ stack, app }: StackContext) {
  const { database } = use(Database);

  // run migrations
  const dbMigrationsFunction = new Function(stack, "DbMigrations", {
    handler: "packages/functions/src/migrations.handler",
    copyFiles: [
      {
        from: "migrations",
      },
    ],
    enableLiveDev: false,
    bind: [database],
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
