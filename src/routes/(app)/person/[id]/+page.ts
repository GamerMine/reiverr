import type { PageLoad } from '../../../../../.svelte-kit/types/src/routes';

export const load = (async ({ params }) => {
	return {
		personId: Number(params.id)
	};
}) satisfies PageLoad;
