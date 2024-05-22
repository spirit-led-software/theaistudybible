import { Constants, DatabaseScripts, Layers } from '@revelationsai/infra';
import type { CfnFunction } from 'aws-cdk-lib/aws-lambda';
import { Api, Function, dependsOn, use, type StackContext } from 'sst/constructs';

export function API({ stack }: StackContext) {
  dependsOn(DatabaseScripts);

  const { hostedZone, apiUrl, apiDomainName, websiteUrl } = use(Constants);
  const { chromiumLayer, axiomX86Layer } = use(Layers);

  const webpageScraperFunction = new Function(stack, 'webpageScraperFunction', {
    handler: 'apps/functions/src/scraper/webpage/webpage.handler',
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
          handler: 'apps/functions/src/scraper/web-crawl.handler',
          timeout: '15 minutes',
          memorySize: '2 GB'
        }
      },
      'POST /scraper/webpage': webpageScraperFunction,
      'POST /scraper/file/presigned-url': 'apps/functions/src/scraper/file/upload-url.handler',
      'POST /scraper/file/remote-download':
        'apps/functions/src/scraper/file/remote-download.handler',

      // Webhooks
      'POST /webhooks/clerk': 'apps/functions/src/webhooks/clerk.handler',
      'POST /webhooks/stripe': 'apps/functions/src/webhooks/stripe.handler',
      'POST /webhooks/revenue-cat': 'apps/functions/src/webhooks/revenue-cat.handler',

      $default: 'apps/api/src/index.handler'
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
