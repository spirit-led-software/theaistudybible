import { Constants, DatabaseScripts } from '@theaistudybible/infra';
import { CLOUDFRONT_HOSTED_ZONE_ID } from '@theaistudybible/infra/constants';
import { Fn } from 'aws-cdk-lib';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import {
  CachePolicy,
  CachedMethods,
  Distribution,
  OriginRequestPolicy,
  ResponseHeadersPolicy,
  ViewerProtocolPolicy
} from 'aws-cdk-lib/aws-cloudfront';
import { HttpOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { HttpMethod } from 'aws-cdk-lib/aws-lambda';
import { ARecord, AaaaRecord, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { Function, dependsOn, use, type StackContext } from 'sst/constructs';

export function ChatAPI({ stack, app }: StackContext) {
  dependsOn(DatabaseScripts);

  const { hostedZone, apiDomainName, domainNamePrefix, websiteUrl } = use(Constants);

  const chatApiFunction = new Function(stack, 'chatApiFunction', {
    handler: 'apps/functions/src/chat.handler',
    memorySize: '3 GB',
    timeout: '5 minutes',
    enableLiveDev: false, // Can't do live dev with streaming
    url: {
      streaming: true,
      authorizer: 'none',
      cors: {
        allowCredentials: true,
        allowOrigins: [websiteUrl],
        allowHeaders: ['Authorization', 'Content-Type'],
        allowMethods: [HttpMethod.ALL],
        exposeHeaders: ['*']
      }
    }
  });

  let chatApiUrl = chatApiFunction.url!;
  // Create cloudfront distribution for non-dev environments
  if (app.stage === 'prod') {
    const chatApiUrlDistribution = new Distribution(stack, 'chatApiUrlDistribution', {
      defaultBehavior: {
        origin: new HttpOrigin(Fn.select(2, Fn.split('/', chatApiUrl))),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        originRequestPolicy: OriginRequestPolicy.CORS_CUSTOM_ORIGIN,
        cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
        allowedMethods: {
          methods: ['HEAD', 'DELETE', 'POST', 'GET', 'OPTIONS', 'PUT', 'PATCH']
        },
        responseHeadersPolicy: new ResponseHeadersPolicy(
          stack,
          'chatApiUrlDistResponseHeadersPolicy',
          {
            corsBehavior: {
              originOverride: true,
              accessControlAllowCredentials: true,
              accessControlAllowHeaders: ['Authorization', 'Content-type'],
              accessControlAllowMethods: ['POST', 'OPTIONS'],
              accessControlAllowOrigins: [websiteUrl],
              accessControlExposeHeaders: [
                'x-chat-id',
                'x-user-message-id',
                'x-ai-response-id',
                'content-type',
                'content-length'
              ]
            }
          }
        )
      },
      domainNames: [`chat.${apiDomainName}`],
      certificate: new Certificate(stack, 'chatApiUrlCertificate', {
        domainName: `chat.${apiDomainName}`,
        validation: CertificateValidation.fromDns(hostedZone)
      })
    });
    const chatApiUrlARecord = new ARecord(stack, 'chatApiUrlARecord', {
      zone: hostedZone,
      recordName: `chat.api${domainNamePrefix ? `.${domainNamePrefix}` : ''}`,
      target: RecordTarget.fromAlias({
        bind: () => ({
          dnsName: chatApiUrlDistribution.distributionDomainName,
          hostedZoneId: CLOUDFRONT_HOSTED_ZONE_ID
        })
      })
    });
    const chatApiUrlAAAARecord = new AaaaRecord(stack, 'chatApiUrlAAAARecord', {
      zone: hostedZone,
      recordName: `chat.api${domainNamePrefix ? `.${domainNamePrefix}` : ''}`,
      target: RecordTarget.fromAlias({
        bind: () => ({
          dnsName: chatApiUrlDistribution.distributionDomainName,
          hostedZoneId: CLOUDFRONT_HOSTED_ZONE_ID
        })
      })
    });
    chatApiUrlAAAARecord.node.addDependency(chatApiUrlARecord);
    chatApiUrl = `https://${chatApiUrlAAAARecord.domainName}`;
  }

  stack.addOutputs({
    ChatApiUrl: chatApiUrl
  });

  return {
    chatApiFunction,
    chatApiUrl
  };
}
