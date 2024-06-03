import { sveltekit } from '@sveltejs/kit/vite';
import { cjsInterop } from 'vite-plugin-cjs-interop';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    sveltekit(),
    cjsInterop({
      dependencies: ['@clerk/clerk-js']
    })
  ],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}']
  },
  server: {
    fs: {
      allow: ['./tailwind.config.ts']
    }
  }
});
