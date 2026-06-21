import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import workerPlugin from 'vite-plugin-node-worker';

export default defineConfig({
	plugins: [sveltekit(), workerPlugin()],
	worker: {
		plugins: () => [workerPlugin()]
	}
});
