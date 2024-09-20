import { sentrySolidStartVite } from '@sentry/solidstart';
import { defineConfig } from '@solidjs/start/config';
import { Resource } from 'sst';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  middleware: './src/middleware.ts',
  server: {
    preset: 'aws-lambda-streaming',
    plugins: ['./sentry.plugin.ts'],
  },
  vite: {
    envPrefix: 'PUBLIC_',
    plugins: [
      tsconfigPaths(),
      sentrySolidStartVite({
        org: Resource.SentryOrg.value,
        project: Resource.SentryProject.value,
        authToken: Resource.SentryAuthToken.value,
      }),
    ],
  },
});
