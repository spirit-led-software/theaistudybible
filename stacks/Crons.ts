import { Constants, DatabaseScripts, Queues, S3, STATIC_ENV_VARS } from '@stacks';
import { Cron, StackContext, dependsOn, use } from 'sst/constructs';

export function Crons({ stack, app }: StackContext) {
  dependsOn(DatabaseScripts);

  const { invokeBedrockPolicy } = use(Constants);
  const { devotionImageBucket, indexFileBucket } = use(S3);
  const { webpageIndexQueue } = use(Queues);
  const { dbReadWriteUrl, dbReadOnlyUrl, vectorDbReadWriteUrl, vectorDbReadOnlyUrl } =
    use(DatabaseScripts);

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
          environment: {
            ...STATIC_ENV_VARS,
            DEVOTION_IMAGE_BUCKET: devotionImageBucket.bucketName,
            DATABASE_READWRITE_URL: dbReadWriteUrl,
            DATABASE_READONLY_URL: dbReadOnlyUrl,
            VECTOR_DB_READWRITE_URL: vectorDbReadWriteUrl,
            VECTOR_DB_READONLY_URL: vectorDbReadOnlyUrl
          },
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
          environment: {
            ...STATIC_ENV_VARS,
            DATABASE_READWRITE_URL: dbReadWriteUrl,
            DATABASE_READONLY_URL: dbReadOnlyUrl,
            VECTOR_DB_READWRITE_URL: vectorDbReadWriteUrl,
            VECTOR_DB_READONLY_URL: vectorDbReadOnlyUrl
          },
          timeout: '5 minutes',
          memorySize: '1 GB'
        }
      }
    });

    new Cron(stack, 'recreateHnswIndexesCron', {
      // once a week
      schedule: 'cron(0 4 ? * 7 *)',
      job: {
        function: {
          handler: 'packages/functions/src/crons/recreate-indexes.handler',
          environment: {
            ...STATIC_ENV_VARS,
            DATABASE_READWRITE_URL: dbReadWriteUrl,
            DATABASE_READONLY_URL: dbReadOnlyUrl,
            VECTOR_DB_READWRITE_URL: vectorDbReadWriteUrl,
            VECTOR_DB_READONLY_URL: vectorDbReadOnlyUrl
          },
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
          environment: {
            ...STATIC_ENV_VARS,
            DATABASE_READWRITE_URL: dbReadWriteUrl,
            DATABASE_READONLY_URL: dbReadOnlyUrl,
            VECTOR_DB_READWRITE_URL: vectorDbReadWriteUrl,
            VECTOR_DB_READONLY_URL: vectorDbReadOnlyUrl
          },
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
            ...STATIC_ENV_VARS,
            DATABASE_READWRITE_URL: dbReadWriteUrl,
            DATABASE_READONLY_URL: dbReadOnlyUrl,
            VECTOR_DB_READWRITE_URL: vectorDbReadWriteUrl,
            VECTOR_DB_READONLY_URL: vectorDbReadOnlyUrl,
            INDEX_FILE_BUCKET: indexFileBucket.bucketName
          },
          timeout: '15 minutes',
          memorySize: '2 GB'
        }
      }
    });
  }
}
