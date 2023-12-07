import { vitePreprocess } from '@sveltejs/kit/vite';
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
			'@core/configs': '../core/src/configs',
			'@core/model': '../core/src/database/model',
			'@core/schema': '../core/src/database/schema',
			'@core': '../core/src'
		}
	}
};

export default config;
