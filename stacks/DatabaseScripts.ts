import { STATIC_ENV_VARS } from "@stacks";
import { Function, Script, StackContext } from "sst/constructs";
import { DatabaseType, getAllNeonConnectionUrls } from "./resources/neon";

export async function DatabaseScripts({ stack, app }: StackContext) {
  const neonConnectionUrls = await getAllNeonConnectionUrls(app, stack);

  const dbReadOnlyUrl = neonConnectionUrls.find(
    (url) => url.type === DatabaseType.READONLY
  )?.url;
  const dbReadWriteUrl = neonConnectionUrls.find(
    (url) => url.type === DatabaseType.READWRITE
  )?.url;
  if (!dbReadWriteUrl) {
    throw new Error("No readwrite database found");
  }

  const vectorDbReadOnlyUrl = neonConnectionUrls.find(
    (url) => url.type === DatabaseType.VECTOR_READONLY
  )?.url;
  const vectorDbReadWriteUrl = neonConnectionUrls.find(
    (url) => url.type === DatabaseType.VECTOR_READWRITE
  )?.url;
  if (!vectorDbReadWriteUrl) {
    throw new Error("No vector readwrite database found");
  }

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
      DATABASE_READWRITE_URL: dbReadWriteUrl,
      DATABASE_READONLY_URL: dbReadOnlyUrl ?? dbReadWriteUrl,
      VECTOR_DB_READWRITE_URL: vectorDbReadWriteUrl,
      VECTOR_DB_READONLY_URL: vectorDbReadOnlyUrl ?? vectorDbReadWriteUrl,
      ...STATIC_ENV_VARS,
    },
    timeout: "5 minutes",
  });
  const dbMigrationsScript = new Script(stack, "dbMigrationsScript", {
    onCreate: dbMigrationsFunction,
    onUpdate: dbMigrationsFunction,
  });

  const dbSeedFunction = new Function(stack, "dbSeedFunction", {
    handler: "packages/functions/src/database/seed.handler",
    enableLiveDev: false,
    environment: {
      DATABASE_READWRITE_URL: dbReadWriteUrl,
      DATABASE_READONLY_URL: dbReadOnlyUrl ?? dbReadWriteUrl,
      VECTOR_DB_READWRITE_URL: vectorDbReadWriteUrl,
      VECTOR_DB_READONLY_URL: vectorDbReadOnlyUrl ?? vectorDbReadWriteUrl,
      ...STATIC_ENV_VARS,
    },
    timeout: "5 minutes",
  });
  dbSeedFunction.node.addDependency(dbMigrationsScript);
  const dbSeedScript = new Script(stack, "dbSeedScript", {
    onCreate: dbSeedFunction,
    onUpdate: dbSeedFunction,
  });

  stack.addOutputs({
    DatabaseReadOnlyUrl: dbReadOnlyUrl,
    DatabaseReadWriteUrl: dbReadWriteUrl,
    VectorDbReadOnlyUrl: vectorDbReadOnlyUrl,
    VectorDbReadWriteUrl: vectorDbReadWriteUrl,
  });

  return {
    dbReadOnlyUrl,
    dbReadWriteUrl,
    vectorDbReadOnlyUrl,
    vectorDbReadWriteUrl,
    dbMigrationsScript,
    dbSeedScript,
  };
}
