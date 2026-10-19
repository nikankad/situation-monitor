import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite';

export default mergeConfig(
	viteConfig,
	defineConfig({
		// Resolve Svelte's client build so components can be mounted in jsdom
		resolve: { conditions: ['browser'] },
		test: {
			include: ['src/**/*.{test,spec}.{js,ts}'],
			environment: 'jsdom',
			globals: true
		}
	})
);
