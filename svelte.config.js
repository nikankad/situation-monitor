import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter(),
		alias: {
			$lib: 'src/lib',
			$components: 'src/lib/components',
			$stores: 'src/lib/stores',
			$services: 'src/lib/services',
			$config: 'src/lib/config',
			$types: 'src/lib/types'
		}
	}
};

export default config;
