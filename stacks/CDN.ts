import { S3 } from '@stacks';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { Distribution } from 'aws-cdk-lib/aws-cloudfront';
import { HttpOrigin, S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { ARecord, AaaaRecord, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { Config, use, type StackContext } from 'sst/constructs';
import { CLOUDFRONT_HOSTED_ZONE_ID, Constants } from './Constants';

export function CDN({ app, stack }: StackContext) {
  const { domainName, domainNamePrefix, hostedZone } = use(Constants);
  const {
    devotionImageBucket,
    devotionImageBucketOriginAccessIdentity,
    userGeneratedImageBucket,
    userGeneratedImageBucketOriginAccessIdentity,
    userProfilePictureBucket,
    userProfilePictureBucketOriginAccessIdentity
  } = use(S3);

  let cdnDomainName: string | undefined = undefined;
  let cdnUrl: string | undefined = undefined;
  let cdn: Distribution | undefined = undefined;

  // Create cloudfront distribution for non-dev environments
  if (stack.stage === 'prod') {
    cdnDomainName = `cdn.${domainName}`;
    cdn = new Distribution(stack, 'CDN', {
      defaultBehavior: {
        origin: new HttpOrigin(domainName)
      },
      additionalBehaviors: {
        '/devotion-images/*': {
          origin: new S3Origin(devotionImageBucket.cdk.bucket, {
            originAccessIdentity: devotionImageBucketOriginAccessIdentity
          })
        },
        'user-generated-images/*': {
          origin: new S3Origin(userGeneratedImageBucket.cdk.bucket, {
            originAccessIdentity: userGeneratedImageBucketOriginAccessIdentity
          })
        },
        'user-profile-pictures/*': {
          origin: new S3Origin(userProfilePictureBucket.cdk.bucket, {
            originAccessIdentity: userProfilePictureBucketOriginAccessIdentity
          })
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

    stack.addOutputs({
      CdnUrl: cdnUrl
    });
  }

  const CDN_URL = new Config.Parameter(stack, 'CDN_URL', {
    value: cdnUrl || ''
  });
  app.addDefaultFunctionBinding([CDN_URL]);

  return {
    cdn,
    cdnUrl,
    cdnDomainName
  };
}
