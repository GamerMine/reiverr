<script lang="ts">
	import type { JellyfinItem } from '$lib/apis/jellyfin/jellyfinApi';
	import type { RadarrMovie } from '$lib/apis/radarr/radarrApi';
	import type { SonarrSeries } from '$lib/apis/sonarr/sonarrApi';
	import type { TitleType } from '$lib/types';
	import { DotsVertical } from 'svelte-radix';
	import Button from '$lib/components/common/inputs/buttons/Button.svelte';
	import ContextMenuButton from '$lib/components/common/inputs/contextMenu/ContextMenuButton.svelte';
	import LibraryItemContextItems from '$lib/components/common/inputs/contextMenu/LibraryItemContextItems.svelte';

	let {
		title = '',

		jellyfinItem = undefined,
		sonarrSeries = undefined,
		radarrMovie = undefined,

		type,
		tmdbId
	}: {
		title?: string;

		jellyfinItem?: JellyfinItem;
		sonarrSeries?: SonarrSeries;
		radarrMovie?: RadarrMovie;

		type: TitleType;
		tmdbId: number;
	} = $props();
</script>

<ContextMenuButton heading={title}>
	{#snippet menu()}
		<LibraryItemContextItems {jellyfinItem} {sonarrSeries} {radarrMovie} {type} {tmdbId} />
	{/snippet}
	<Button slim>
		<DotsVertical size="24" />
	</Button>
</ContextMenuButton>
