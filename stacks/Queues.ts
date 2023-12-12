import { Constants, DatabaseScripts, STATIC_ENV_VARS } from '@stacks';
import { Duration } from 'aws-cdk-lib/core';
import { Queue, StackContext, dependsOn, use } from 'sst/constructs';

export function Queues({ stack }: StackContext) {
  dependsOn(DatabaseScripts);

  const { invokeBedrockPolicy } = use(Constants);
  const { dbReadWriteUrl, dbReadOnlyUrl, vectorDbReadWriteUrl, vectorDbReadOnlyUrl } =
    use(DatabaseScripts);

  const webpageIndexQueue = new Queue(stack, 'webpageIndexQueue', {
    cdk: {
      queue: {
        visibilityTimeout: Duration.minutes(15)
      }
    },
    consumer: {
      cdk: {
        eventSource: {
          batchSize: 1
        }
      },
      function: {
        handler: 'packages/functions/src/scraper/webpage/queue.consumer',
        environment: {
          ...STATIC_ENV_VARS,
          DATABASE_READWRITE_URL: dbReadWriteUrl,
          DATABASE_READONLY_URL: dbReadOnlyUrl,
          VECTOR_DB_READWRITE_URL: vectorDbReadWriteUrl,
          VECTOR_DB_READONLY_URL: vectorDbReadOnlyUrl
        },
        permissions: [invokeBedrockPolicy],
        runtime: 'nodejs18.x',
        nodejs: {
          install: ['@sparticuz/chromium'],
          esbuild: {
            external: ['@sparticuz/chromium']
          }
        },
        reservedConcurrentExecutions: stack.stage !== 'prod' ? 2 : 25,
        timeout: '15 minutes',
        memorySize: '1 GB'
      }
    }
  });
  webpageIndexQueue.bind([webpageIndexQueue]);
  webpageIndexQueue.attachPermissions([webpageIndexQueue]);

  return {
    webpageIndexQueue
  };
}
