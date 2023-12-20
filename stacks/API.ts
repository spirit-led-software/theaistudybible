import { Constants, DatabaseScripts, Queues, S3 } from '@stacks';
import { Api, dependsOn, use, type StackContext } from 'sst/constructs';

export function API({ stack }: StackContext) {
  dependsOn(DatabaseScripts);

  const { webpageIndexQueue } = use(Queues);
  const { hostedZone, apiUrl, apiDomainName, websiteUrl, invokeBedrockPolicy, authUiUrl } =
    use(Constants);
  const { indexFileBucket } = use(S3);

  const api = new Api(stack, 'api', {
    routes: {
      'POST /scraper/web-crawl': {
        function: {
          handler: 'packages/functions/src/scraper/web-crawl.handler',
          bind: [webpageIndexQueue],
          permissions: [webpageIndexQueue],
          timeout: '15 minutes',
          memorySize: '2 GB'
        }
      },
      'POST /scraper/webpage': {
        function: {
          handler: 'packages/functions/src/scraper/webpage/webpage.handler',
          nodejs: {
            install: ['@sparticuz/chromium']
          },
          permissions: [invokeBedrockPolicy],
          timeout: '15 minutes',
          memorySize: '2 GB'
        }
      },
      'POST /scraper/file/presigned-url': {
        function: {
          handler: 'packages/functions/src/scraper/file/upload-url.handler',
          bind: [indexFileBucket],
          permissions: [indexFileBucket],
          environment: {
            INDEX_FILE_BUCKET: indexFileBucket.bucketName
          }
        }
      },
      'POST /scraper/file/remote-download': {
        function: {
          handler: 'packages/functions/src/scraper/file/remote-download.handler',
          bind: [indexFileBucket],
          permissions: [indexFileBucket],
          environment: {
            INDEX_FILE_BUCKET: indexFileBucket.bucketName
          }
        }
      },

      // Webhooks
      'POST /notifications/stripe': 'packages/functions/src/webhooks/stripe.handler',
      'POST /notifications/revenue-cat': 'packages/functions/src/webhooks/revenue-cat.handler',

      // Vector similarity search
      'POST /vector-search': {
        function: {
          handler: 'packages/functions/src/rest/vector-search/post.handler',
          permissions: [invokeBedrockPolicy]
        }
      }
    },
    defaults: {
      function: {
        timeout: '60 seconds',
        memorySize: '1 GB'
      }
    },
    customDomain: {
      domainName: apiDomainName,
      hostedZone: hostedZone.zoneName
    },
    cors: {
      allowCredentials: true,
      allowOrigins: [websiteUrl, authUiUrl],
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
