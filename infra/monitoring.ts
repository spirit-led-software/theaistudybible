import { isProd } from './constants';

export let webAppSentryProject: versesentry.SentryProject | undefined;
export let webAppSentryKey: versesentry.SentryKey | undefined;
if (isProd) {
  if (!process.env.SENTRY_ORG || !process.env.SENTRY_TEAM) {
    throw new Error('SENTRY_ORG and SENTRY_TEAM must be set');
  }
  webAppSentryProject = new versesentry.SentryProject('WebAppProject', {
    organization: process.env.SENTRY_ORG,
    team: process.env.SENTRY_TEAM,
    name: `${$app.name}-${$app.stage}-www`,
    platform: 'javascript-solidstart',
    resolveAge: 24 * 7, // 1 week in hours
  });
  webAppSentryKey = new versesentry.SentryKey('WebAppSentryDsn', {
    organization: process.env.SENTRY_ORG,
    project: webAppSentryProject.name,
  });
}
