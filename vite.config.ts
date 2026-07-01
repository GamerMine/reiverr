import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'url';

const excludedFromBuild = ['src/lib/remote/test.remote.ts', 'src/routes/tests/+page.svelte'];

export default defineConfig(({ command }) => {
	return {
		plugins: [sveltekit()],

		build: {
			rolldownOptions: {
				external: [
					...excludedFromBuild.map((src) => fileURLToPath(new URL(src, import.meta.url)))
				]
			}
		},
		// FIXME: The following expo-sqlite related stuff fixes a typeorm issue (see ./src/stubs/expo-sqlite.js)
		resolve: {
			alias: {
				'expo-sqlite': path.resolve('./src/stubs/expo-sqlite.js')
			}
		},
		optimizeDeps: {
			exclude: ['expo-sqlite']
		},
		ssr:
			command === 'build'
				? {
						noExternal: ['typeorm']
					}
				: {}
	};
});
