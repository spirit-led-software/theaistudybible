import { isProd } from './utils/constants';

export const SENTRY_ORG = process.env.SENTRY_ORG;
export const SENTRY_TEAM = process.env.SENTRY_TEAM;

if (!SENTRY_ORG || !SENTRY_TEAM) {
  throw new Error('SENTRY_ORG and SENTRY_TEAM must be set');
}

export const webAppSentryProject = isProd
  ? new sentry.SentryProject(
      'WebAppSentryProject',
      {
        organization: SENTRY_ORG,
        team: SENTRY_TEAM,
        name: `${$app.name}-www`,
        platform: 'javascript',
        resolveAge: 24 * 7, // 1 week in hours
      },
      { retainOnDelete: true },
    )
  : sentry.SentryProject.get(
      'WebAppSentryProject',
      `${$app.name}-www`,
      { name: `${$app.name}-www` },
      { retainOnDelete: true },
    );

export const webAppSentryKey = new sentry.SentryKey('WebAppSentryKey', {
  organization: SENTRY_ORG,
  project: webAppSentryProject.name,
});
