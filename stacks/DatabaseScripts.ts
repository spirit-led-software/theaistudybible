import { Constants, Jobs, Layers, STATIC_ENV_VARS } from '@stacks';
import { Script, dependsOn, use, type StackContext } from 'sst/constructs';
import { NeonBranch } from './resources/NeonBranch';

export function DatabaseScripts({ stack, app }: StackContext) {
  dependsOn(Constants);
  dependsOn(Layers);
  dependsOn(Jobs);

  const { argonLayer } = use(Layers);
  const { hnswIndexJob } = use(Jobs);

  const neonBranch = new NeonBranch(stack, 'neonBranch', {
    apiKey: STATIC_ENV_VARS.NEON_API_KEY,
    projectName: app.name,
    branchName: stack.stage === 'prod' ? 'main' : stack.stage,
    roleName: app.name,
    endpointOptions: [
      {
        type: 'read_write',
        provisioner: 'k8s-neonvm',
        autoscaling_limit_min_cu: stack.stage === 'prod' ? 0.5 : 0.25,
        autoscaling_limit_max_cu: stack.stage === 'prod' ? 7 : 1,
        suspend_timeout_seconds: 0
      }
    ],
    retainOnDelete: stack.stage === 'prod'
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
        timeout: '15 minutes'
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
        enableLiveDev: false,
        environment: dbScriptEnv,
        permissions: [hnswIndexJob],
        bind: [hnswIndexJob],
        timeout: '15 minutes'
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
