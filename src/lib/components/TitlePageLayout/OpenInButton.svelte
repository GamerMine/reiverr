<script lang="ts">
	import type { TitleType } from '$lib/utils/types';
	import { DotsVertical } from 'svelte-radix';
	import Button from '$lib/components/controls/Button.svelte';
	import ContextMenuButton from '$lib/components/controls/ContextMenuButton.svelte';
	import LibraryItemContextItems from '$lib/components/controls/LibraryItemContextItems.svelte';
	import type { JellyfinBaseItemDto } from '@reiverr/connectors/types/jellyfin';

	let {
		title = '',

		jellyfinItem = undefined,

		type,
		tmdbId
	}: {
		title?: string;

		jellyfinItem?: JellyfinBaseItemDto;

		type: TitleType;
		tmdbId: number;
	} = $props();
</script>

<ContextMenuButton heading={title}>
	{#snippet menu()}
		<LibraryItemContextItems {jellyfinItem} {type} {tmdbId} />
	{/snippet}
	<Button slim>
		<DotsVertical size="24" />
	</Button>
</ContextMenuButton>
