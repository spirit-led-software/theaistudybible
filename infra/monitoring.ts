import { DOMAIN } from './constants';

import { Constant } from './resources';

export const SENTRY_ORG = process.env.SENTRY_ORG;
export const SENTRY_TEAM = process.env.SENTRY_TEAM;

if (!SENTRY_ORG || !SENTRY_TEAM) {
  throw new Error('SENTRY_ORG and SENTRY_TEAM must be set');
}

export const webAppSentryProject = new versesentry.SentryProject('WebAppProject', {
  organization: SENTRY_ORG,
  team: SENTRY_TEAM,
  name: `${$app.name}-${$app.stage}-www`,
  platform: 'javascript-solidstart',
  resolveAge: 24 * 7, // 1 week in hours
});

export const webAppSentryKey = new versesentry.SentryKey('WebAppSentryDsn', {
  organization: SENTRY_ORG,
  project: webAppSentryProject.name,
});

export const MONITORING_DOMAIN = new Constant('MonitoringDomain', `m.${DOMAIN.value}`);

export const monitoringProxy = new sst.cloudflare.Worker('MonitoringProxy', {
  handler: 'apps/workers/src/proxy/monitoring.ts',
  environment: {
    SENTRY_DSN: webAppSentryKey.dsnPublic,
  },
  domain: MONITORING_DOMAIN.value,
});

export const MONITORING_URL = new Constant('MonitoringUrl', `https://${MONITORING_DOMAIN.value}`);
