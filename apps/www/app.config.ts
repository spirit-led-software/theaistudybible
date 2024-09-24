import { sentrySolidStartVite } from '@sentry/solidstart';
import { defineConfig } from '@solidjs/start/config';
import { formatDate } from 'date-fns';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  middleware: './src/middleware.ts',
  server: {
    preset: 'bun',
    // @ts-expect-error - This is the correct format
    compatibilityDate: formatDate(new Date(), 'yyyy-MM-dd'),
  },
  vite: {
    envPrefix: 'PUBLIC_',
    plugins: [
      tsconfigPaths(),
      sentrySolidStartVite({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
      }),
    ],
  },
});
