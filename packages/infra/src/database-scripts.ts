import { Database } from '@revelationsai/infra';
import { Script, dependsOn, type StackContext } from 'sst/constructs';

export function DatabaseScripts({ stack }: StackContext) {
  dependsOn(Database);

  const dbMigrationsScript = new Script(stack, 'dbMigrationsScript', {
    onCreate: 'apps/functions/src/database/migrations.handler',
    onUpdate: 'apps/functions/src/database/migrations.handler',
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
    onCreate: 'apps/functions/src/database/seed.handler',
    onUpdate: 'apps/functions/src/database/seed.handler',
    defaults: {
      function: {
        enableLiveDev: false,
        timeout: '15 minutes'
      }
    }
  });

  return {
    dbMigrationsScript,
    dbSeedScript
  };
}
