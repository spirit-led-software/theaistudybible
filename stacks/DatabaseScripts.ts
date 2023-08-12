import { STATIC_ENV_VARS } from "@stacks";
import { Function, Script, StackContext } from "sst/constructs";
import { NeonBranch } from "./resources/neon/neon";

export async function DatabaseScripts({ stack, app }: StackContext) {
  const neonBranch = new NeonBranch(stack, "neonBranch", {
    isProd: stack.stage === "prod",
    projectName: app.name,
    branchName: stack.stage,
    roleName: app.name,
  });

  const dbScriptEnv = {
    DATABASE_READWRITE_URL: neonBranch.dbReadWriteUrl,
    DATABASE_READONLY_URL: neonBranch.dbReadOnlyUrl,
    VECTOR_DB_READWRITE_URL: neonBranch.vectorDbReadWriteUrl,
    VECTOR_DB_READONLY_URL: neonBranch.vectorDbReadOnlyUrl,
    ...STATIC_ENV_VARS,
  };

  const dbMigrationsFunction = new Function(stack, "dbMigrationsFunction", {
    handler: "packages/functions/src/database/migrations.handler",
    copyFiles: [
      {
        from: "migrations",
        to: "migrations",
      },
    ],
    enableLiveDev: false,
    environment: dbScriptEnv,
    timeout: "5 minutes",
  });
  const dbMigrationsScript = new Script(stack, "dbMigrationsScript", {
    onCreate: dbMigrationsFunction,
    onUpdate: dbMigrationsFunction,
  });

  const dbSeedFunction = new Function(stack, "dbSeedFunction", {
    handler: "packages/functions/src/database/seed.handler",
    enableLiveDev: false,
    environment: dbScriptEnv,
    timeout: "5 minutes",
  });
  dbSeedFunction.node.addDependency(dbMigrationsScript);
  const dbSeedScript = new Script(stack, "dbSeedScript", {
    onCreate: dbSeedFunction,
    onUpdate: dbSeedFunction,
  });

  stack.addOutputs({
    DatabaseReadOnlyUrl: neonBranch.dbReadOnlyUrl,
    DatabaseReadWriteUrl: neonBranch.dbReadWriteUrl,
    VectorDbReadOnlyUrl: neonBranch.vectorDbReadOnlyUrl,
    VectorDbReadWriteUrl: neonBranch.vectorDbReadWriteUrl,
  });

  return {
    neonBranch,
    dbReadOnlyUrl: neonBranch.dbReadOnlyUrl,
    dbReadWriteUrl: neonBranch.dbReadWriteUrl,
    vectorDbReadOnlyUrl: neonBranch.vectorDbReadOnlyUrl,
    vectorDbReadWriteUrl: neonBranch.vectorDbReadWriteUrl,
    dbMigrationsScript,
    dbSeedScript,
  };
}
