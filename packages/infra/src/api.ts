import { Constants, DatabaseScripts, Layers } from '@revelationsai/infra';
import type { CfnFunction } from 'aws-cdk-lib/aws-lambda';
import { Api, Function, dependsOn, use, type StackContext } from 'sst/constructs';

export function API({ stack }: StackContext) {
  dependsOn(DatabaseScripts);

  const { hostedZone, apiUrl, apiDomainName, websiteUrl } = use(Constants);
  const { chromiumLayer, axiomX86Layer } = use(Layers);

  const webpageScraperFunction = new Function(stack, 'webpageScraperFunction', {
    handler: 'packages/functions/src/scraper/webpage/webpage.handler',
    architecture: 'x86_64',
    runtime: 'nodejs18.x',
    layers: [chromiumLayer, axiomX86Layer],
    timeout: '15 minutes',
    memorySize: '2 GB'
  });
  // add layers
  (webpageScraperFunction.node.defaultChild as CfnFunction).addPropertyOverride('Layers', [
    chromiumLayer.layerVersionArn,
    axiomX86Layer.layerVersionArn
  ]);

  const api = new Api(stack, 'api', {
    routes: {
      'POST /scraper/web-crawl': {
        function: {
          handler: 'packages/functions/src/scraper/web-crawl.handler',
          timeout: '15 minutes',
          memorySize: '2 GB'
        }
      },
      'POST /scraper/webpage': webpageScraperFunction,
      'POST /scraper/file/presigned-url': 'packages/functions/src/scraper/file/upload-url.handler',
      'POST /scraper/file/remote-download':
        'packages/functions/src/scraper/file/remote-download.handler',

      // Webhooks
      'POST /notifications/stripe': 'packages/functions/src/webhooks/stripe.handler',
      'POST /notifications/revenue-cat': 'packages/functions/src/webhooks/revenue-cat.handler',

      // Vector similarity search
      'POST /vector-search': 'packages/functions/src/rest/vector-search/post.handler'
    },
    customDomain: {
      domainName: apiDomainName,
      hostedZone: hostedZone.zoneName
    },
    cors: {
      allowCredentials: true,
      allowOrigins: [websiteUrl],
      allowHeaders: ['Authorization', 'Content-Type'],
      allowMethods: ['ANY'],
      exposeHeaders: ['*']
    }
  });

  stack.addOutputs({
    ApiUrl: apiUrl
  });

  return {
    api
  };
}
