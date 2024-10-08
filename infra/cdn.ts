import { DOMAIN } from './constants';
import { devotionImagesBucket, generatedImagesBucket, profileImagesBucket } from './storage';

export const cdn = new sst.aws.Router('Cdn', {
  routes: {
    '/profile-images/*': {
      bucket: profileImagesBucket,
      rewrite: {
        regex: '^/profile-images/(.*)$',
        to: '/$1',
      },
    },
    '/generated-images/*': {
      bucket: generatedImagesBucket,
      rewrite: {
        regex: '^/generated-images/(.*)$',
        to: '/$1',
      },
    },
    '/devotion-images/*': {
      bucket: devotionImagesBucket,
      rewrite: {
        regex: '^/devotion-images/(.*)$',
        to: '/$1',
      },
    },
  },
  domain: {
    name: `cdn.${DOMAIN.value}`,
    dns: sst.cloudflare.dns(),
  },
});
