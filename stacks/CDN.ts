import { S3 } from '@stacks';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import {
  AllowedMethods,
  CachePolicy,
  CachedMethods,
  Distribution,
  OriginRequestPolicy,
  ResponseHeadersPolicy,
  ViewerProtocolPolicy
} from 'aws-cdk-lib/aws-cloudfront';
import { HttpOrigin, S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { ARecord, AaaaRecord, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { use, type StackContext } from 'sst/constructs';
import { CLOUDFRONT_HOSTED_ZONE_ID, Constants } from './Constants';

export function CDN({ app, stack }: StackContext) {
  const { websiteUrl, authUiUrl, domainName, domainNamePrefix, hostedZone } = use(Constants);
  const { devotionImageBucket, userGeneratedImageBucket, userProfilePictureBucket } = use(S3);

  let cdnDomainName: string | undefined = undefined;
  let cdnUrl: string | undefined = undefined;
  let cdn: Distribution | undefined = undefined;

  // Create cloudfront distribution for non-dev environments
  if (stack.stage === 'prod') {
    cdnDomainName = `cdn.${domainName}`;
    cdn = new Distribution(stack, 'CDN', {
      defaultBehavior: {
        origin: new HttpOrigin(cdnDomainName),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        originRequestPolicy: OriginRequestPolicy.CORS_CUSTOM_ORIGIN,
        cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        responseHeadersPolicy: new ResponseHeadersPolicy(stack, 'CDNResponseHeadersPolicy', {
          corsBehavior: {
            originOverride: true,
            accessControlAllowCredentials: true,
            accessControlAllowHeaders: ['Authorization', 'Content-type'],
            accessControlAllowMethods: ['GET', 'HEAD', 'OPTIONS'],
            accessControlAllowOrigins: [websiteUrl, authUiUrl],
            accessControlExposeHeaders: ['content-type', 'content-length']
          }
        })
      },
      additionalBehaviors: {
        'devotion-images/*': {
          origin: new S3Origin(devotionImageBucket.cdk.bucket)
        },
        'user-generated-images/*': {
          origin: new S3Origin(userGeneratedImageBucket.cdk.bucket)
        },
        'user-profile-pictures/*': {
          origin: new S3Origin(userProfilePictureBucket.cdk.bucket)
        }
      },
      domainNames: [cdnDomainName],
      certificate: new Certificate(stack, 'CDNCertificate', {
        domainName: cdnDomainName,
        validation: CertificateValidation.fromDns(hostedZone)
      })
    });
    const cdnARecord = new ARecord(stack, 'CDNARecord', {
      zone: hostedZone,
      recordName: `cdn${domainNamePrefix ? `.${domainNamePrefix}` : ''}`,
      target: RecordTarget.fromAlias({
        bind: () => ({
          dnsName: cdn!.distributionDomainName,
          hostedZoneId: CLOUDFRONT_HOSTED_ZONE_ID
        })
      })
    });
    const cdnAaaaRecord = new AaaaRecord(stack, 'CDNAAAARecord', {
      zone: hostedZone,
      recordName: `cdn${domainNamePrefix ? `.${domainNamePrefix}` : ''}`,
      target: RecordTarget.fromAlias({
        bind: () => ({
          dnsName: cdn!.distributionDomainName,
          hostedZoneId: CLOUDFRONT_HOSTED_ZONE_ID
        })
      })
    });
    cdnAaaaRecord.node.addDependency(cdnARecord);
    cdnUrl = `https://${cdnAaaaRecord.domainName}`;

    app.addDefaultFunctionEnv({
      CDN_URL: cdnUrl
    });

    stack.addOutputs({
      CdnUrl: cdnUrl
    });
  }

  return {
    cdn,
    cdnUrl,
    cdnDomainName
  };
}
