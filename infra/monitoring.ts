export const SENTRY_ORG = process.env.SENTRY_ORG;
export const SENTRY_TEAM = process.env.SENTRY_TEAM;

if (!SENTRY_ORG || !SENTRY_TEAM) {
  throw new Error('SENTRY_ORG and SENTRY_TEAM must be set');
}

export const webAppSentryProject = new sentry.SentryProject('WebAppProject', {
  organization: SENTRY_ORG,
  team: SENTRY_TEAM,
  name: `${$app.name}-${$app.stage}-www`,
  platform: 'javascript',
  resolveAge: 24 * 7, // 1 week in hours
});

export const webAppSentryKey = new sentry.SentryKey('WebAppSentryDsn', {
  organization: SENTRY_ORG,
  project: webAppSentryProject.name,
});
