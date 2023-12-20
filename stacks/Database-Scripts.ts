import { Database, Jobs, Layers } from '@stacks';
import { Script, dependsOn, use, type StackContext } from 'sst/constructs';

export function DatabaseScripts({ stack }: StackContext) {
  dependsOn(Database);

  const { argonLayer } = use(Layers);
  const { hnswIndexJob } = use(Jobs);

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
        permissions: [hnswIndexJob],
        bind: [hnswIndexJob],
        timeout: '15 minutes'
      }
    }
  });

  return {
    dbMigrationsScript,
    dbSeedScript
  };
}
