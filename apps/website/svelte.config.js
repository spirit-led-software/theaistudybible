import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import adapter from 'svelte-kit-sst';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
    // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
    // See https://kit.svelte.dev/docs/adapters for more information about adapters.
    adapter: adapter(),
    alias: {
      '@theaistudybible/core': '../../packages/core/src',
      '@theaistudybible/langchain': '../../packages/langchain/src',
      '@theaistudybible/server': '../../packages/server/src',
      '@theaistudybible/api': '../api/src'
    },
    typescript: {
      config: (config) => {
        config.include = [...config.include, '../../../packages/core/globals.d.ts'];
      }
    }
  }
};

export default config;
