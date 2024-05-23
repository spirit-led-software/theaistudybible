import { sveltekit } from '@sveltejs/kit/vite';
import { searchForWorkspaceRoot } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    fs: {
      allow: [searchForWorkspaceRoot(process.cwd())]
    }
  },
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}']
  }
});
