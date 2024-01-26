import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import adapter from 'svelte-kit-sst';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter(),
		alias: {
			'@revelationsai/core': '../core/src',
			'@revelationsai/server': '../server/src',
			'@revelationsai/client': '../client/src'
		}
	}
};

export default config;
