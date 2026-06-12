import { writable } from 'svelte/store';
import { modalStack } from '$lib/stores/modal.store';
import VideoPlayer from './VideoPlayer.svelte';
import { jellyfinGetItems } from '$lib/remote/jellyfin.remote';

const initialValue = { visible: false, jellyfinId: '' };
export type PlayerStateValue = typeof initialValue;

function createPlayerState() {
	const store = writable<PlayerStateValue>(initialValue);

	return {
		...store,
		streamJellyfinId: (id: string) => {
			store.set({ visible: true, jellyfinId: id });
			modalStack.create(VideoPlayer, {}); // FIXME
		},
		close: () => {
			store.set({ visible: false, jellyfinId: '' });
			jellyfinGetItems().refresh();
		}
	};
}

export const playerState = createPlayerState();
