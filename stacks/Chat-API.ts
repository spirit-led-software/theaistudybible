import { Constants, DatabaseScripts, STATIC_ENV_VARS } from '@stacks';
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
import { FunctionUrlAuthType, HttpMethod, InvokeMode } from 'aws-cdk-lib/aws-lambda';
import { ARecord, AaaaRecord, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { Function, dependsOn, use, type StackContext } from 'sst/constructs';

const CLOUDFRONT_HOSTED_ZONE_ID = 'Z2FDTNDATAQYW2';

export function ChatAPI({ stack, app }: StackContext) {
  dependsOn(DatabaseScripts);

  const { hostedZone, domainName, domainNamePrefix, websiteUrl, invokeBedrockPolicy } =
    use(Constants);
  const { dbReadOnlyUrl, dbReadWriteUrl, vectorDbReadOnlyUrl, vectorDbReadWriteUrl } =
    use(DatabaseScripts);

  const apiDomainName = `api.${domainName}`;
  const apiUrl = `https://${apiDomainName}`;

  const chatApiFunction = new Function(stack, 'chatApiFunction', {
    handler: 'packages/functions/src/chat.handler',
    environment: {
      ...STATIC_ENV_VARS,
      WEBSITE_URL: websiteUrl,
      API_URL: apiUrl,
      DATABASE_READWRITE_URL: dbReadWriteUrl,
      DATABASE_READONLY_URL: dbReadOnlyUrl,
      VECTOR_DB_READWRITE_URL: vectorDbReadWriteUrl,
      VECTOR_DB_READONLY_URL: vectorDbReadOnlyUrl
    },
    timeout: '2 minutes',
    enableLiveDev: false, // Cannot live dev with response stream
    memorySize: '1536 MB',
    permissions: [invokeBedrockPolicy]
  });
  const chatApiFunctionUrl = chatApiFunction.addFunctionUrl({
    invokeMode: InvokeMode.RESPONSE_STREAM,
    authType: FunctionUrlAuthType.NONE,
    cors: {
      allowCredentials: true,
      allowedOrigins: [websiteUrl],
      allowedHeaders: ['Authorization', 'Content-Type'],
      allowedMethods: [HttpMethod.ALL],
      exposedHeaders: ['*']
    }
  });

  let chatApiUrl = chatApiFunctionUrl.url;
  // Create cloudfront distribution for non-dev environments
  if (app.stage === 'prod') {
    const chatApiUrlDistribution = new Distribution(stack, 'chatApiUrlDistribution', {
      defaultBehavior: {
        origin: new HttpOrigin(Fn.select(2, Fn.split('/', chatApiFunctionUrl.url))),
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
    chatApiFunctionUrl,
    chatApiUrl
  };
}
