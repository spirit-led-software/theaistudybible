import { DatabaseScripts, Layers } from '@theaistudybible/infra';
import { Duration } from 'aws-cdk-lib/core';
import { Function, Queue, dependsOn, use, type StackContext } from 'sst/constructs';

export function Queues({ app, stack }: StackContext) {
  dependsOn(DatabaseScripts);

  const { chromiumLayer } = use(Layers);

  const webpageIndexQueueConsumerFunction = new Function(
    stack,
    'WebpageIndexQueueConsumerFunction',
    {
      handler: 'apps/functions/src/scraper/webpage-queue.consumer',
      architecture: 'x86_64',
      runtime: 'nodejs18.x',
      layers: [chromiumLayer],
      timeout: '15 minutes',
      memorySize: '2 GB'
    }
  );
  const webpageScraperQueue = new Queue(stack, 'WebpageScraperQueue', {
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
      function: webpageIndexQueueConsumerFunction
    }
  });
  webpageScraperQueue.bind([webpageScraperQueue]);
  webpageScraperQueue.attachPermissions([webpageScraperQueue]);

  app.addDefaultFunctionBinding([webpageScraperQueue]);
  app.addDefaultFunctionPermissions([webpageScraperQueue]);

  return {
    webpageScraperQueue
  };
}
