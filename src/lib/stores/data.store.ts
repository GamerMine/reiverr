import { getJellyfinItems, type JellyfinItem } from '$lib/apis/jellyfin/jellyfinApi';
import { getSonarrSeries } from '$lib/apis/sonarr/sonarrApi';
import { writable } from 'svelte/store';
import { settings } from '$lib/stores/settings.svelte';

// TODO: These stores could be "converted" to global state variables for easier use or remote functions.

async function waitForSettings() {
	return new Promise((resolve) => {
		resolve(settings);
	});
}

type AwaitableStoreValue<R, T = { data?: R }> = {
	loading: boolean;
} & T;

function _createDataFetchStore<T>(fn: () => Promise<T>) {
	const store = writable<AwaitableStoreValue<T>>({
		loading: true,
		data: undefined
	});

	async function refresh() {
		store.update((s) => ({ ...s, loading: true }));
		return waitForSettings().then(() =>
			fn().then((data) => {
				store.set({ loading: false, data });
				return data;
			})
		);
	}

	let updateTimeout: NodeJS.Timeout;
	function refreshIn(ms = 1000) {
		return new Promise((resolve) => {
			clearTimeout(updateTimeout);
			updateTimeout = setTimeout(() => {
				refresh().then(resolve);
			}, ms);
		});
	}

	return {
		subscribe: store.subscribe,
		refresh,
		refreshIn,
		promise: refresh()
	};
}

export const jellyfinItemsStore = _createDataFetchStore(getJellyfinItems);

export function createJellyfinItemStore(tmdbId: number | Promise<number>) {
	const store = writable<{ loading: boolean; item?: JellyfinItem }>({
		loading: true,
		item: undefined
	});

	jellyfinItemsStore.subscribe(async (s) => {
		const awaited = await tmdbId;

		store.set({
			loading: s.loading,
			item: s.data?.find((i) => i.ProviderIds?.Tmdb === String(awaited))
		});
	});

	return {
		subscribe: store.subscribe,
		refresh: jellyfinItemsStore.refresh,
		refreshIn: jellyfinItemsStore.refreshIn,
		promise: new Promise<JellyfinItem | undefined>((resolve) => {
			store.subscribe((s) => {
				if (!s.loading) resolve(s.item);
			});
		})
	};
}

export const sonarrSeriesStore = _createDataFetchStore(getSonarrSeries);
