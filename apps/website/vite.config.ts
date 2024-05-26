import { sentrySvelteKit } from '@sentry/sveltekit';
import { sveltekit } from '@sveltejs/kit/vite';
import { searchForWorkspaceRoot } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    sentrySvelteKit({
      sourceMapsUploadOptions: {
        org: 'the-ai-study-bible',
        project: 'sveltekit',
        authToken: process.env.SENTRY_AUTH_TOKEN
      }
    }),
    sveltekit()
  ],
  server: {
    fs: {
      allow: [searchForWorkspaceRoot(process.cwd())]
    }
  },
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}']
  }
});
