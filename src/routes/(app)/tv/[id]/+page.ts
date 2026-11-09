import type { PageLoad } from '../../../../../.svelte-kit/types/src/routes';

export const load = (async ({ params }) => {
	return {
		tmdbId: Number(params.id)
	};
}) satisfies PageLoad;
