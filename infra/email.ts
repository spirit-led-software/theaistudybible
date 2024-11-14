import { DOMAIN } from './constants';
import { BASE_DOMAIN, isProd } from './utils/constants';

export const email = isProd
  ? new sst.aws.Email(
      'Email',
      { sender: DOMAIN.value, dns: sst.aws.dns({ override: true }) },
      { retainOnDelete: true },
    )
  : sst.aws.Email.get('Email', BASE_DOMAIN, { retainOnDelete: true });
