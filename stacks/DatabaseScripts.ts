import { Jobs, Layers, STATIC_ENV_VARS } from '@stacks';
import { Function, Script, StackContext, use } from 'sst/constructs';
import { NeonBranch } from './resources/NeonBranch';

export function DatabaseScripts({ stack, app }: StackContext) {
  const { argonLayer } = use(Layers);
  const { hnswIndexJob } = use(Jobs);

  const neonBranch = new NeonBranch(stack, 'neonBranch', {
    projectName: app.name,
    branchName: stack.stage === 'prod' ? 'main' : stack.stage,
    roleName: app.name,
    isProd: stack.stage === 'prod',
    apiKey: STATIC_ENV_VARS.NEON_API_KEY
  });

  const dbScriptEnv = {
    ...STATIC_ENV_VARS,
    DATABASE_READWRITE_URL: neonBranch.urls.dbReadWriteUrl,
    DATABASE_READONLY_URL: neonBranch.urls.dbReadOnlyUrl,
    VECTOR_DB_READWRITE_URL: neonBranch.urls.vectorDbReadWriteUrl,
    VECTOR_DB_READONLY_URL: neonBranch.urls.vectorDbReadOnlyUrl
  };

  const dbMigrationsScript = new Script(stack, 'dbMigrationsScript', {
    onCreate: 'packages/functions/src/database/migrations.handler',
    onUpdate: 'packages/functions/src/database/migrations.handler',
    defaults: {
      function: {
        copyFiles: [
          {
            from: 'migrations',
            to: 'migrations'
          }
        ],
        enableLiveDev: false,
        environment: dbScriptEnv,
        timeout: '15 minutes',
        memorySize: '256 MB'
      }
    }
  });
  
  const dbSeedScript = new Script(stack, 'dbSeedScript', {
    version: process.env.DATABASE_SEED === 'false' ? '1' : undefined, // only run seed script on first deploy if DATABASE_SEED is false
    onCreate: 'packages/functions/src/database/seed.handler',
    onUpdate: 'packages/functions/src/database/seed.handler',
    defaults: {
      function: {
        layers: [argonLayer],
        nodejs: {
          esbuild: {
            external: ['argon2']
          }
        },
        enableLiveDev: false,
        permissions: [hnswIndexJob],
        bind: [hnswIndexJob],
        environment: dbScriptEnv,
        timeout: '15 minutes',
        memorySize: '256 MB'
      }
    }
  });

  stack.addOutputs({
    DatabaseReadOnlyUrl: neonBranch.urls.dbReadOnlyUrl,
    DatabaseReadWriteUrl: neonBranch.urls.dbReadWriteUrl,
    VectorDbReadOnlyUrl: neonBranch.urls.vectorDbReadOnlyUrl,
    VectorDbReadWriteUrl: neonBranch.urls.vectorDbReadWriteUrl
  });

  return {
    neonBranch,
    dbReadOnlyUrl: neonBranch.urls.dbReadOnlyUrl,
    dbReadWriteUrl: neonBranch.urls.dbReadWriteUrl,
    vectorDbReadOnlyUrl: neonBranch.urls.vectorDbReadOnlyUrl,
    vectorDbReadWriteUrl: neonBranch.urls.vectorDbReadWriteUrl,
    dbMigrationsScript,
    dbSeedScript
  };
}
