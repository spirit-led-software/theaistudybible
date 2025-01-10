import { isProd } from './utils/constants';

if (!process.env.SENTRY_ORG || !process.env.SENTRY_TEAM) {
  throw new Error('SENTRY_ORG and SENTRY_TEAM must be set');
}

export const sentryOrg = sentry.getSentryOrganizationOutput({ slug: process.env.SENTRY_ORG });
export const sentryTeam = sentry.getSentryTeamOutput({
  organization: sentryOrg.slug,
  slug: process.env.SENTRY_TEAM,
});

export const webAppSentryProject = isProd
  ? new sentry.SentryProject(
      'WebAppSentryProject',
      {
        organization: sentryOrg.slug,
        team: sentryTeam.slug,
        name: `${$app.name}-www`,
        platform: 'javascript',
        resolveAge: 24 * 7, // 1 week in hours
      },
      { retainOnDelete: true },
    )
  : sentry.SentryProject.get(
      'WebAppSentryProject',
      $interpolate`${sentryOrg.id}/${$app.name}-www`,
      { name: `${$app.name}-www` },
      { retainOnDelete: true },
    );

export const webAppSentryKey = new sentry.SentryKey('WebAppSentryKey', {
  organization: sentryOrg.slug,
  project: webAppSentryProject.slug,
});
