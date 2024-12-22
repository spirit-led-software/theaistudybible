import { AWS_HOSTED_ZONE, DOMAIN } from './constants';
import { BASE_DOMAIN, isProd } from './utils/constants';

export const email = isProd
  ? new sst.aws.Email(
      'Email',
      { sender: DOMAIN.value, dns: sst.aws.dns({ override: true }) },
      { retainOnDelete: true },
    )
  : sst.aws.Email.get('Email', BASE_DOMAIN, { retainOnDelete: true });

if (isProd) {
  // Custom Mail-From domain
  const mailFrom = new aws.ses.MailFrom('MailFrom', {
    domain: DOMAIN.value,
    mailFromDomain: $interpolate`mail.${DOMAIN.value}`,
  });
  new aws.route53.Record('MailFromMX', {
    zoneId: AWS_HOSTED_ZONE.zoneId,
    name: mailFrom.mailFromDomain,
    type: 'MX',
    ttl: 300,
    records: ['10 feedback-smtp.us-east-1.amazonses.com'],
  });
  new aws.route53.Record('MailFromTXT', {
    zoneId: AWS_HOSTED_ZONE.zoneId,
    name: mailFrom.mailFromDomain,
    type: 'TXT',
    ttl: 300,
    records: ['v=spf1 include:amazonses.com ~all'],
  });

  // BIMI setup
  new aws.route53.Record('DmarcRecord', {
    zoneId: AWS_HOSTED_ZONE.zoneId,
    name: $interpolate`_dmarc.${DOMAIN.value}`,
    type: 'TXT',
    ttl: 300,
    records: [$interpolate`v=DMARC1;p=reject;rua=mailto:dmarcreports@${DOMAIN.value}`],
  });
  new aws.route53.Record('BimiRecord', {
    zoneId: AWS_HOSTED_ZONE.zoneId,
    name: $interpolate`default._bimi.${DOMAIN.value}`,
    type: 'TXT',
    ttl: 300,
    records: [$interpolate`v=BIMI1;l=https://${DOMAIN.value}/icon.svg;a=self`],
  });
}
