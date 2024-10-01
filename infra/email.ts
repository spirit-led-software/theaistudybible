import { BASE_DOMAIN, DOMAIN } from './constants';

export const email =
  $app.stage === 'production'
    ? new sst.aws.Email('Email', {
        sender: DOMAIN.value,
        dns: sst.cloudflare.dns(),
      })
    : sst.aws.Email.get('Email', BASE_DOMAIN);
