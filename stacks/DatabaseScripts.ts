import { STATIC_ENV_VARS } from "@stacks";
import { Function, Script, StackContext } from "sst/constructs";

export function DatabaseScripts({ stack }: StackContext) {
  const dbMigrationsFunction = new Function(stack, "dbMigrationsFunction", {
    handler: "packages/functions/src/database/migrations.handler",
    copyFiles: [
      {
        from: "migrations",
        to: "migrations",
      },
    ],
    enableLiveDev: false,
    environment: {
      ...STATIC_ENV_VARS,
    },
  });
  const dbMigrationsScript = new Script(stack, "dbMigrationsScript", {
    onCreate: dbMigrationsFunction,
    onUpdate: dbMigrationsFunction,
  });

  const dbSeedFunction = new Function(stack, "dbSeedFunction", {
    handler: "packages/functions/src/database/seed.handler",
    enableLiveDev: false,
    environment: {
      ...STATIC_ENV_VARS,
    },
  });
  dbSeedFunction.node.addDependency(dbMigrationsScript);
  const dbSeedScript = new Script(stack, "dbSeedScript", {
    onCreate: dbSeedFunction,
    onUpdate: dbSeedFunction,
  });

  return {
    dbMigrationsScript,
    dbSeedScript,
  };
}
