import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: {
      "@theaistudybible/core": "../../packages/core/src",
      "@theaistudybible/langchain": "../../packages/langchain/src",
      "@theaistudybible/server": "../../packages/server/src",
      "@theaistudybible/api": "../api/src",
      "@lib/server/database": "./src/lib/database",
      "@lib/server/cache": "./src/lib/cache"
    },
    typescript: {
      config: (config) => ({
        ...config,
        include: [
          ...config.include,
          "../../../packages/core/globals.d.ts"
        ]
      })
    }
  },
};

export default config;
