<script lang="ts">
	import {
		setJellyfinItemUnwatched,
		setJellyfinItemWatched,
		type JellyfinItem
	} from '$lib/apis/jellyfin/jellyfinApi';
	import { jellyfinItemsStore } from '$lib/stores/data.store';
	import type { TitleType } from '$lib/types';
	import Divider from '../../misc/Divider.svelte';
	import ContextMenuItem from './ContextMenuItem.svelte';
	import { _ } from 'svelte-i18n';
	import { settings } from '$lib/stores/settings.svelte.js';

	let {
		jellyfinItem = undefined,
		type,
		tmdbId
	}: {
		jellyfinItem?: JellyfinItem;
		type: TitleType;
		tmdbId: number;
	} = $props();

	let watched = $state(false);
	$effect(() => {
		watched =
			jellyfinItem?.UserData?.Played !== undefined ? jellyfinItem.UserData?.Played : false;
	});

	function handleSetWatched() {
		if (jellyfinItem?.Id) {
			watched = true;
			setJellyfinItemWatched(jellyfinItem.Id).finally(() =>
				jellyfinItemsStore.refreshIn(3000)
			);
		}
	}

	function handleSetUnwatched() {
		if (jellyfinItem?.Id) {
			watched = false;
			setJellyfinItemUnwatched(jellyfinItem.Id).finally(() =>
				jellyfinItemsStore.refreshIn(3000)
			);
		}
	}

	function handleOpenInJellyfin() {
		window.open(
			settings.globalSettings.jellyfin.baseUrl +
				'/web/index.html#!/details?id=' +
				jellyfinItem?.Id
		);
	}
</script>

<ContextMenuItem onclick={handleSetWatched} disabled={!jellyfinItem?.Id || watched}>
	{$_('library.LibraryItemContext.markWatched')}
</ContextMenuItem>
<ContextMenuItem onclick={handleSetUnwatched} disabled={!jellyfinItem?.Id || !watched}>
	{$_('library.LibraryItemContext.markUnwatched')}
</ContextMenuItem>
<Divider />
<ContextMenuItem disabled={!jellyfinItem?.Id} onclick={handleOpenInJellyfin}>
	{$_('library.LibraryItemContext.openJellyfin')}
</ContextMenuItem>
<ContextMenuItem onclick={() => window.open(`https://www.themoviedb.org/${type}/${tmdbId}`)}>
	{$_('library.LibraryItemContext.openTMDB')}
</ContextMenuItem>
