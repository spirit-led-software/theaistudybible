import { CLOUDFLARE_ZONE_ID, DOMAIN } from './constants';
import { BASE_DOMAIN, isProd } from './utils/constants';

export const email = isProd
  ? new sst.aws.Email(
      'Email',
      { sender: DOMAIN.value, dns: sst.cloudflare.dns({ override: true }) },
      { retainOnDelete: true },
    )
  : sst.aws.Email.get('Email', BASE_DOMAIN, { retainOnDelete: true });

if (isProd) {
  // Custom Mail-From domain
  const mailFrom = new aws.ses.MailFrom('MailFrom', {
    domain: DOMAIN.value,
    mailFromDomain: $interpolate`mail.${DOMAIN.value}`,
  });
  new cloudflare.Record('MailFromMX', {
    zoneId: CLOUDFLARE_ZONE_ID.zoneId,
    name: mailFrom.mailFromDomain,
    type: 'MX',
    ttl: 300,
    content: 'feedback-smtp.us-east-1.amazonses.com',
    priority: 10,
    proxied: false,
    allowOverwrite: true,
  });
  new cloudflare.Record('MailFromTXT', {
    zoneId: CLOUDFLARE_ZONE_ID.zoneId,
    name: mailFrom.mailFromDomain,
    type: 'TXT',
    ttl: 300,
    content: 'v=spf1 include:amazonses.com ~all',
    allowOverwrite: true,
  });

  // BIMI setup
  new cloudflare.Record('DmarcRecord', {
    zoneId: CLOUDFLARE_ZONE_ID.zoneId,
    name: $interpolate`_dmarc.${DOMAIN.value}`,
    type: 'TXT',
    ttl: 300,
    content: $interpolate`v=DMARC1;p=reject;rua=mailto:dmarcreports@${DOMAIN.value}`,
    allowOverwrite: true,
  });
  new cloudflare.Record('BimiRecord', {
    zoneId: CLOUDFLARE_ZONE_ID.zoneId,
    name: $interpolate`default._bimi.${DOMAIN.value}`,
    type: 'TXT',
    ttl: 300,
    content: $interpolate`v=BIMI1;l=https://${DOMAIN.value}/icon.svg;a=self`,
    allowOverwrite: true,
  });
}
