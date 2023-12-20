import { Constants, DatabaseScripts } from '@stacks';
import { Duration } from 'aws-cdk-lib/core';
import { Queue, dependsOn, use, type StackContext } from 'sst/constructs';

export function Queues({ stack }: StackContext) {
  dependsOn(DatabaseScripts);

  const { invokeBedrockPolicy } = use(Constants);

  const webpageIndexQueue = new Queue(stack, 'webpageIndexQueue', {
    cdk: {
      queue: {
        retentionPeriod: Duration.days(1),
        visibilityTimeout: Duration.minutes(15)
      }
    },
    consumer: {
      cdk: {
        eventSource: {
          batchSize: 1,
          maxConcurrency: stack.stage !== 'prod' ? 2 : 25
        }
      },
      function: {
        handler: 'packages/functions/src/scraper/webpage/queue.consumer',
        permissions: [invokeBedrockPolicy],
        runtime: 'nodejs18.x',
        nodejs: {
          install: ['@sparticuz/chromium']
        },
        timeout: '15 minutes',
        memorySize: '2 GB'
      }
    }
  });
  webpageIndexQueue.bind([webpageIndexQueue]);
  webpageIndexQueue.attachPermissions([webpageIndexQueue]);

  return {
    webpageIndexQueue
  };
}
