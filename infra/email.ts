import { BASE_DOMAIN, DOMAIN, isProd } from './constants';

export const email = isProd
  ? new sst.aws.Email('Email', {
      sender: DOMAIN.value,
      dns: sst.cloudflare.dns(),
    })
  : sst.aws.Email.get('Email', BASE_DOMAIN);
