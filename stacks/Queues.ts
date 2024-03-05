import { DatabaseScripts, Layers } from '@stacks';
import type { CfnFunction } from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib/core';
import { Function, Queue, dependsOn, use, type StackContext } from 'sst/constructs';

export function Queues({ app, stack }: StackContext) {
  dependsOn(DatabaseScripts);

  const { chromiumLayer, axiomX86Layer } = use(Layers);

  const webpageIndexQueueConsumerFunction = new Function(
    stack,
    'webpageIndexQueueConsumerFunction',
    {
      handler: 'packages/functions/src/scraper/webpage/queue.consumer',
      architecture: 'x86_64',
      runtime: 'nodejs18.x',
      timeout: '15 minutes',
      memorySize: '2 GB'
    }
  );
  // add layers
  (webpageIndexQueueConsumerFunction.node.defaultChild as CfnFunction).addPropertyOverride(
    'Layers',
    [chromiumLayer.layerVersionArn, axiomX86Layer.layerVersionArn]
  );
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
      function: webpageIndexQueueConsumerFunction
    }
  });
  webpageIndexQueue.bind([webpageIndexQueue]);
  webpageIndexQueue.attachPermissions([webpageIndexQueue]);

  app.addDefaultFunctionBinding([webpageIndexQueue]);
  app.addDefaultFunctionPermissions([webpageIndexQueue]);

  return {
    webpageIndexQueue
  };
}
