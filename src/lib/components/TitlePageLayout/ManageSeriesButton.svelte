<script lang="ts">
	import Button from '#lib/components/controls/Button.svelte';
	import ContextMenu from '#lib/components/controls/ContextMenu.svelte';
	import ContextMenuItem from '#lib/components/controls/ContextMenuItem.svelte';
	import { settings } from '#lib/stores/settings.svelte.js';
	import { ActivityLog, ChevronRight, Clock, Download, Trash } from 'svelte-radix';
	import { _ } from 'svelte-i18n';
	import type { SonarrSeriesResource } from '@unifarr/connectors/types/sonarr';
	import type { JellyfinBaseItemDto } from '@unifarr/connectors/types/jellyfin';

	let {
		isBeingRemoved,
		isBeingAdded,
		nextJellyfinEpisode,
		sonarrSeries,
		addLoading,
		onPlay,
		onAdd,
		onRemove
	}: {
		isBeingRemoved: boolean;
		isBeingAdded: boolean;
		nextJellyfinEpisode?: JellyfinBaseItemDto;
		sonarrSeries?: SonarrSeriesResource;
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
{:else if !!nextJellyfinEpisode}
	<Button variant="primary" onclick={onPlay}>
		<span>
			{$_('library.content.play')}
			{`S${nextJellyfinEpisode?.ParentIndexNumber}E${nextJellyfinEpisode?.IndexNumber}`}
		</span>
		<ChevronRight size="20" />
	</Button>
	<Button variant="error" class="px-2!" onclick={onRemove}>
		<Trash size="20" />
	</Button>
{:else if !sonarrSeries && settings.globalSettings.sonarr.baseUrl && !isBeingAdded}
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
{:else if sonarrSeries}
	<Button variant="primary" disabled>
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
