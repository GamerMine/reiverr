<script lang="ts">
	import {
		setJellyfinItemUnwatched,
		setJellyfinItemWatched,
		type JellyfinItem
	} from '$lib/apis/jellyfin/jellyfinApi';
	import type { RadarrMovie } from '$lib/apis/radarr/radarrApi';
	import type { SonarrSeries } from '$lib/apis/sonarr/sonarrApi';
	import { jellyfinItemsStore } from '$lib/stores/data.store';
	import { settings } from '$lib/stores/settings.store';
	import type { TitleType } from '$lib/types';
	import ContextMenuDivider from './ContextMenuDivider.svelte';
	import ContextMenuItem from './ContextMenuItem.svelte';
	import { _ } from 'svelte-i18n';

	let {
		jellyfinItem = undefined,
		sonarrSeries = undefined,
		radarrMovie = undefined,
		type,
		tmdbId
	}: {
		jellyfinItem?: JellyfinItem;
		sonarrSeries?: SonarrSeries;
		radarrMovie?: RadarrMovie;
		type: TitleType;
		tmdbId: number;
	} = $props();

	let watched = $state(false);
	$effect(() => {
		watched = jellyfinItem?.UserData?.Played !== undefined ? jellyfinItem.UserData?.Played : false;
	});

	function handleSetWatched() {
		if (jellyfinItem?.Id) {
			watched = true;
			setJellyfinItemWatched(jellyfinItem.Id).finally(() => jellyfinItemsStore.refreshIn(3000));
		}
	}

	function handleSetUnwatched() {
		if (jellyfinItem?.Id) {
			watched = false;
			setJellyfinItemUnwatched(jellyfinItem.Id).finally(() => jellyfinItemsStore.refreshIn(3000));
		}
	}

	function handleOpenInJellyfin() {
		window.open($settings.jellyfin.baseUrl + '/web/index.html#!/details?id=' + jellyfinItem?.Id);
	}
</script>

<ContextMenuItem onclick={handleSetWatched} disabled={!jellyfinItem?.Id || watched}>
	{$_('library.LibraryItemContext.markWatched')}
</ContextMenuItem>
<ContextMenuItem onclick={handleSetUnwatched} disabled={!jellyfinItem?.Id || !watched}>
	{$_('library.LibraryItemContext.markUnwatched')}
</ContextMenuItem>
<ContextMenuDivider />
<ContextMenuItem disabled={!jellyfinItem?.Id} onclick={handleOpenInJellyfin}>
	{$_('library.LibraryItemContext.openJellyfin')}
</ContextMenuItem>
{#if type === 'movie'}
	<ContextMenuItem
		disabled={!radarrMovie}
		onclick={() => window.open($settings.radarr.baseUrl + '/movie/' + radarrMovie?.tmdbId)}
	>
		{$_('library.LibraryItemContext.openRadarr')}
	</ContextMenuItem>
{:else}
	<ContextMenuItem
		disabled={!sonarrSeries}
		onclick={() => window.open($settings.sonarr.baseUrl + '/series/' + sonarrSeries?.titleSlug)}
	>
		{$_('library.LibraryItemContext.openSonarr')}
	</ContextMenuItem>
{/if}
<ContextMenuItem onclick={() => window.open(`https://www.themoviedb.org/${type}/${tmdbId}`)}>
	{$_('library.LibraryItemContext.openTMDB')}
</ContextMenuItem>
