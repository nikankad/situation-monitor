import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
	plugins: [sveltekit()],
	css: {
		postcss: fileURLToPath(new URL('.', import.meta.url))
	}
});
