import type { TitleType } from '$lib/utils/types.ts';
import { writable } from 'svelte/store';

type Type = TitleType | undefined;

function createTitlePageModalStore() {
	const store = writable<{ tmdbId: number | undefined; type: Type }>({
		tmdbId: undefined,
		type: undefined
	});

	return {
		subscribe: store.subscribe,
		set: (tmdbId: number | undefined, type: Type) => store.set({ tmdbId, type }),
		close: () => store.set({ tmdbId: undefined, type: undefined })
	};
}

export const titlePageModal = createTitlePageModalStore();
