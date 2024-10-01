export let webAppSentryProject: versesentry.SentryProject | null = null;
if ($app.stage === 'production') {
  if (!process.env.SENTRY_ORG || !process.env.SENTRY_TEAM) {
    throw new Error('SENTRY_ORG and SENTRY_TEAM must be set');
  }
  webAppSentryProject = new versesentry.SentryProject('WebAppProject', {
    organization: process.env.SENTRY_ORG,
    team: process.env.SENTRY_TEAM,
    name: `${$app.name}-${$app.stage}-www`,
  });
}
