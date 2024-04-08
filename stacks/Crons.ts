import { DatabaseScripts, Layers, Queues, S3 } from '@stacks';
import type { CfnFunction } from 'aws-cdk-lib/aws-lambda';
import { Cron, Function, dependsOn, use, type StackContext } from 'sst/constructs';

export function Crons({ stack }: StackContext) {
  dependsOn(DatabaseScripts);
  dependsOn(S3);
  dependsOn(Queues);

  const { chromiumLayer, axiomX86Layer } = use(Layers);

  if (stack.stage === 'prod') {
    new Cron(stack, 'dailyDevoCron', {
      schedule: 'cron(0 13 * * ? *)',
      job: {
        function: {
          handler: 'packages/functions/src/crons/daily-devo.handler',
          copyFiles: [
            {
              from: 'firebase-service-account.json',
              to: 'firebase-service-account.json'
            }
          ],
          timeout: '5 minutes',
          memorySize: '2 GB'
        }
      }
    });

    new Cron(stack, 'dailyQueryCron', {
      schedule: 'cron(0 23 * * ? *)',
      job: {
        function: {
          handler: 'packages/functions/src/crons/daily-query.handler',
          copyFiles: [
            {
              from: 'firebase-service-account.json',
              to: 'firebase-service-account.json'
            }
          ],
          timeout: '5 minutes',
          memorySize: '2 GB'
        }
      }
    });

    new Cron(stack, 'indexOpCleanupCron', {
      schedule: 'cron(0 1 * * ? *)',
      job: {
        function: {
          handler: 'packages/functions/src/crons/index-op-cleanup.handler',
          timeout: '15 minutes',
          memorySize: '1 GB'
        }
      }
    });

    const dataSourceSyncCronFunction = new Function(stack, 'DataSourceSyncCronFunction', {
      handler: 'packages/functions/src/crons/data-source-sync.handler',
      architecture: 'x86_64',
      runtime: 'nodejs18.x',
      memorySize: '2 GB',
      timeout: '15 minutes'
    });
    // add layers
    (dataSourceSyncCronFunction.node.defaultChild as CfnFunction).addPropertyOverride('Layers', [
      chromiumLayer.layerVersionArn,
      axiomX86Layer.layerVersionArn
    ]);

    new Cron(stack, 'dataSourceSyncCron', {
      schedule: 'cron(0 2 * * ? *)',
      job: {
        function: dataSourceSyncCronFunction
      }
    });
  }
}
