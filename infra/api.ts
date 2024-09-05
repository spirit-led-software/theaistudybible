import { DOMAIN } from './constants';
import { generatedImagesBucket } from './storage';

const apiFunction = new sst.aws.Function('ApiFunction', {
  handler: 'apps/api/src/index.handler',
  link: [generatedImagesBucket],
  url: true,
});

const apiRouter =
  $app.stage === 'production'
    ? new sst.aws.Router('ApiRouter', {
        routes: {
          '/*': apiFunction.url,
        },
        domain: {
          name: $interpolate`api.${DOMAIN.properties.value}`,
          dns: sst.cloudflare.dns(),
        },
      })
    : null;

export const api = new sst.Linkable('Api', {
  properties: {
    url: apiRouter?.url ?? apiFunction.url,
  },
});
