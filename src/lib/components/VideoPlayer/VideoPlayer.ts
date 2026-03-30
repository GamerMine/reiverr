import {jellyfinItemsStore} from '$lib/stores/data.store';
import {writable} from 'svelte/store';
import VideoPlayer from './VideoPlayer.svelte';
import modalStore from "$lib/stores/modal.store";

const initialValue = {visible: false, jellyfinId: ''};
export type PlayerStateValue = typeof initialValue;

function createPlayerState() {
    const store = writable<PlayerStateValue>(initialValue);

    return {
        ...store,
        streamJellyfinId: (id: string) => {
            store.set({visible: true, jellyfinId: id});
            modalStore.create(VideoPlayer, {}); // FIXME
        },
        close: () => {
            store.set({visible: false, jellyfinId: ''});
            jellyfinItemsStore.refresh();
        }
    };
}

export const playerState = createPlayerState();
