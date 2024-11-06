import { CLOUDFLARE_ZONE, DOMAIN } from './constants';

export const wwwRecord = new cloudflare.Record('WWWRecord', {
  zoneId: CLOUDFLARE_ZONE.zoneId,
  type: 'A',
  name: $interpolate`www.${DOMAIN.value}`,
  content: '192.0.2.1',
  proxied: true,
});

export const redirect = new cloudflare.Ruleset('RedirectRuleset', {
  kind: 'zone',
  zoneId: CLOUDFLARE_ZONE.zoneId,
  name: 'Redirect www to non-www',
  description: $interpolate`Redirects requests to www.${DOMAIN.value} to ${DOMAIN.value}`,
  phase: 'http_request_dynamic_redirect',
  rules: [
    {
      expression: $interpolate`http.host eq "www.${DOMAIN.value}"`,
      action: 'redirect',
      actionParameters: {
        fromValue: {
          targetUrl: {
            expression: $interpolate`concat("https://${DOMAIN.value}", http.request.uri.path)`,
          },
          statusCode: 301,
          preserveQueryString: true,
        },
      },
    },
  ],
});
