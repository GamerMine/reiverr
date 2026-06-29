<script lang="ts">
	import type { TitleType } from '$lib/utils/types';
	import Divider from '../layout/Divider.svelte';
	import ContextMenuItem from './ContextMenuItem.svelte';
	import { _ } from 'svelte-i18n';
	import { settings } from '$lib/stores/settings.svelte.js';
	import { jellyfinSetItemWatched } from '$lib/remote/jellyfin.remote';
	import type { JellyfinBaseItemDto } from '@reiverr/connectors/types/radarr';

	let {
		jellyfinItem = undefined,
		type,
		tmdbId
	}: {
		jellyfinItem?: JellyfinBaseItemDto;
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
			jellyfinSetItemWatched({ id: jellyfinItem.Id, watched: true });
		}
	}

	function handleSetUnwatched() {
		if (jellyfinItem?.Id) {
			watched = false;
			jellyfinSetItemWatched({ id: jellyfinItem.Id, watched: false });
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
