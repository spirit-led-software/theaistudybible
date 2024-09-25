import { sentrySolidStartVite } from '@sentry/solidstart';
import { defineConfig } from '@solidjs/start/config';
import { formatDate } from 'date-fns';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  middleware: './src/middleware.ts',
  server: {
    preset: 'bun',
    plugins: ['./sentry.plugin.ts'],
    // @ts-expect-error - This is the correct format
    compatibilityDate: formatDate(new Date(), 'yyyy-MM-dd'),
  },
  vite: {
    envPrefix: 'PUBLIC_',
    plugins: [
      tsconfigPaths(),
      sentrySolidStartVite({
        org: 'the-ai-study-bible',
        project: 'javascript-solidstart',
        authToken: process.env.SENTRY_AUTH_TOKEN,
        sourceMapsUploadOptions: {
          unstable_sentryVitePluginOptions: {
            release: {
              name: process.env.SENTRY_RELEASE,
            },
          },
        },
      }),
    ],
  },
});
