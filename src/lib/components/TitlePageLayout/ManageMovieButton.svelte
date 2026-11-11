<script lang="ts">
	import Button from '#lib/components/controls/Button.svelte';
	import ContextMenu from '#lib/components/controls/ContextMenu.svelte';
	import ContextMenuItem from '#lib/components/controls/ContextMenuItem.svelte';
	import { settings } from '#lib/stores/settings.svelte.ts';
	import { ActivityLog, ChevronRight, Clock, Download, Trash } from 'svelte-radix';
	import { _ } from 'svelte-i18n';
	import type { RadarrMovieResource } from '@unifarr/connectors/types/radarr';
	import type { JellyfinBaseItemDto } from '@unifarr/connectors/types/jellyfin';

	let {
		isBeingRemoved,
		isBeingAdded,
		jellyfinItem,
		radarrMovie,
		addLoading,
		onPlay,
		onAdd,
		onRemove
	}: {
		isBeingRemoved: boolean;
		isBeingAdded: boolean;
		jellyfinItem?: JellyfinBaseItemDto;
		radarrMovie?: RadarrMovieResource;
		addLoading: boolean;
		onPlay: () => void;
		onAdd: (language: string) => void;
		onRemove: () => void;
	} = $props();
</script>

{#if isBeingRemoved}
	<Button variant="secondary" disabled>
		<Clock size="20" /><span class="ml-2">{$_('library.content.beingRemoved')}</span>
	</Button>
{:else if jellyfinItem}
	<Button variant="primary" onclick={onPlay}>
		<span>{$_('library.content.play')}</span><ChevronRight size="20" />
	</Button>
	<Button variant="error" class="px-2!" onclick={onRemove}>
		<Trash size="20" />
	</Button>
{:else if !radarrMovie && settings.globalSettings.radarr.baseUrl && !isBeingAdded}
	<div class="relative">
		<ContextMenu position="absolute" disabled={addLoading} heading={$_('library.content.get')}>
			{#snippet menu()}
				{#each settings.globalSettings.general.downloadLanguages as language (language)}
					<ContextMenuItem onclick={() => onAdd(language)}>
						{$_('library.content.getIn', {
							values: { language: $_('languages.' + language) }
						})}
					</ContextMenuItem>
				{/each}
			{/snippet}
			<Button variant="primary" disabled={addLoading}>
				<span>{$_('library.content.get')}</span><Download size="20" />
			</Button>
		</ContextMenu>
	</div>
{:else if radarrMovie}
	<Button variant="secondary" disabled>
		<ActivityLog size="20" /><span class="ml-2">{$_('library.content.queued')}</span>
	</Button>
	<Button variant="error" class="px-2!" onclick={onRemove}>
		<Trash size="20" />
	</Button>
{:else if isBeingAdded}
	<Button variant="secondary" disabled>
		<Clock size="20" /><span class="ml-2">{$_('library.content.beingAdded')}</span>
	</Button>
{/if}
