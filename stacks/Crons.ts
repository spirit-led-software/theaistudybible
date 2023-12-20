import { Constants, DatabaseScripts, Jobs, Queues, S3 } from '@stacks';
import { Cron, dependsOn, use, type StackContext } from 'sst/constructs';

export function Crons({ stack, app }: StackContext) {
  dependsOn(DatabaseScripts);

  const { hnswIndexJob } = use(Jobs);
  const { invokeBedrockPolicy } = use(Constants);
  const { devotionImageBucket, indexFileBucket } = use(S3);
  const { webpageIndexQueue } = use(Queues);

  if (app.stage === 'prod') {
    new Cron(stack, 'dailyDevoCron', {
      schedule: 'cron(0 0 * * ? *)',
      job: {
        function: {
          handler: 'packages/functions/src/crons/daily-devo.handler',
          bind: [devotionImageBucket],
          permissions: [devotionImageBucket, invokeBedrockPolicy],
          copyFiles: [
            {
              from: 'firebase-service-account.json',
              to: 'firebase-service-account.json'
            }
          ],
          timeout: '5 minutes',
          memorySize: '1 GB'
        }
      }
    });

    new Cron(stack, 'dailyQueryCron', {
      schedule: 'cron(0 12 * * ? *)',
      job: {
        function: {
          handler: 'packages/functions/src/crons/daily-query.handler',
          permissions: [invokeBedrockPolicy],
          copyFiles: [
            {
              from: 'firebase-service-account.json',
              to: 'firebase-service-account.json'
            }
          ],
          timeout: '5 minutes',
          memorySize: '1 GB'
        }
      }
    });

    new Cron(stack, 'recreateHnswIndexesCron', {
      // once every month
      schedule: 'cron(0 0 1 * ? *)',
      job: {
        function: {
          handler: 'packages/functions/src/crons/recreate-indexes.handler',
          permissions: [hnswIndexJob],
          bind: [hnswIndexJob],
          timeout: '15 minutes',
          memorySize: '1 GB'
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

    new Cron(stack, 'dataSourceSyncCron', {
      schedule: 'cron(0 2 * * ? *)',
      job: {
        function: {
          handler: 'packages/functions/src/crons/data-source-sync.handler',
          permissions: [invokeBedrockPolicy, indexFileBucket, webpageIndexQueue],
          bind: [indexFileBucket, webpageIndexQueue],
          environment: {
            INDEX_FILE_BUCKET: indexFileBucket.bucketName
          },
          timeout: '15 minutes',
          memorySize: '2 GB'
        }
      }
    });
  }
}
