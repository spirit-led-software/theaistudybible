import { sentryEsbuildPlugin } from '@sentry/esbuild-plugin';

export default [
  sentryEsbuildPlugin({
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    bundleSizeOptimizations: {
      excludeDebugStatements: true,
      excludeReplayIframe: true,
      excludeReplayShadowDom: true,
      excludeReplayWorker: true,
    },
    sourcemaps: { filesToDeleteAfterUpload: ['**/*.map'] },
  }),
];
