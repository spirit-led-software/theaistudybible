import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    csrf: process.env.NODE_ENV === 'production',
    alias: {
      '@theaistudybible/core': '../../packages/core/src',
      '@theaistudybible/langchain': '../../packages/langchain/src',
      '@theaistudybible/server': '../../packages/server/src',
      '@lib/server/database': './src/lib/server/database',
      '@lib/server/cache': './src/lib/server/cache'
    },
    typescript: {
      config: (config) => ({
        ...config,
        include: [...config.include, '../../../packages/core/globals.d.ts']
      })
    }
  }
};

export default config;
