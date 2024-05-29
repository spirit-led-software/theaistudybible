import { publicBucket } from "./buckets";
import { domainName, domainNamePrefix, hostedZone } from "./constants";

export let cdnDomainName: string | undefined = undefined;
export let cdnUrl: string | undefined = undefined;
export let cdn: aws.cloudfront.Distribution | undefined = undefined;

// Create cloudfront distribution for non-dev environments
if ($app.stage === "prod") {
  cdnDomainName = `cdn.${domainName}`;

  const cdnCert = new aws.acm.Certificate("CDNCertificate", {
    domainName: cdnDomainName,
    validationMethod: "DNS",
  });

  const cdnRecords: aws.route53.Record[] = [];
  cdnCert.domainValidationOptions.apply((domainValidationOptions) => {
    for (const range of Object.entries(
      domainValidationOptions.reduce((__obj, dvo) => ({
        ...__obj,
        [dvo.domainName]: {
          name: dvo.resourceRecordName,
          record: dvo.resourceRecordValue,
          type: dvo.resourceRecordType,
        },
      }))
    ).map(([k, v]) => ({ key: k, value: v }))) {
      cdnRecords.push(
        new aws.route53.Record(`cdnCert-${range.key}`, {
          allowOverwrite: true,
          name: range.value.name,
          records: [range.value.record],
          ttl: 60,
          type: aws.route53.RecordType[
            range.value.type as keyof typeof aws.route53.RecordType
          ],
          zoneId: hostedZone.zoneId,
        })
      );
    }
  });
  new aws.acm.CertificateValidation("CDNCertificateValidation", {
    certificateArn: cdnCert.arn,
    validationRecordFqdns: cdnRecords.map((record) => record.fqdn),
  });

  cdn = new aws.cloudfront.Distribution("CDN", {
    origins: [
      {
        domainName: publicBucket.nodes.bucket.bucketRegionalDomainName,
        originId: "PublicBucketS3Origin",
      },
    ],
    defaultCacheBehavior: {
      allowedMethods: ["GET", "HEAD", "OPTIONS"],
      cachedMethods: ["GET", "HEAD", "OPTIONS"],
      viewerProtocolPolicy: "redirect-to-https",
      targetOriginId: "PublicBucketS3Origin",
    },
    enabled: true,
    restrictions: {
      geoRestriction: {
        restrictionType: "none",
      },
    },
    aliases: [cdnDomainName],
    viewerCertificate: {
      acmCertificateArn: cdnCert.arn,
    },
  });
  new aws.route53.Record("CDNARecord", {
    type: "A",
    zoneId: hostedZone.id,
    name: `cdn${domainNamePrefix ? `.${domainNamePrefix}` : ""}`,
    records: [cdn.domainName],
  });
  new aws.route53.Record("CDNAAAARecord", {
    type: "AAAA",
    zoneId: hostedZone.id,
    name: `cdn${domainNamePrefix ? `.${domainNamePrefix}` : ""}`,
    records: [cdn.domainName],
  });

  cdnUrl = `https://${cdnDomainName}`;

  $transform(sst.aws.Function, (args) => {
    args.environment = $resolve([args.environment]).apply(([environment]) => ({
      ...environment,
      CDN_URL: cdnUrl!,
    }));
  });
}
