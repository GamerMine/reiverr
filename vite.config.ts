import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import path from 'node:path';

const excludedFromBuild = ['src/lib/remote/test.remote.ts', 'src/routes/tests/+page.svelte'];

const file = fileURLToPath(new URL('package.json', import.meta.url));
const json = readFileSync(file, 'utf8');
const pkg = JSON.parse(json);

export default defineConfig(({ command }) => {
	return {
		plugins: [
			sveltekit({
				preprocess: vitePreprocess(),
				compilerOptions: { experimental: { async: true } },
				inspector: { holdMode: true },
				adapter: adapter(),
				experimental: { remoteFunctions: true },
				version: { name: pkg.version }
			})
		],
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
