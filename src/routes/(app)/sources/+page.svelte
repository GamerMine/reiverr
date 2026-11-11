<script lang="ts">
	import RadarrStats from '#lib/components/sources/RadarrStats.svelte';
	import SonarrStats from '#lib/components/sources/SonarrStats.svelte';
	import { _ } from 'svelte-i18n';
	import { fade } from 'svelte/transition';
	import { settings } from '#lib/stores/settings.svelte.js';
</script>

<div
	class="flex min-h-screen justify-center px-8 pt-24"
	in:fade|global={{
		duration: settings.userSettings.interface.animationDuration,
		delay: settings.userSettings.interface.animationDuration
	}}
	out:fade|global={{ duration: settings.userSettings.interface.animationDuration }}
>
	<div class="flex max-w-3xl flex-1 flex-col gap-4">
		{#if settings.globalSettings.radarr.baseUrl}
			<RadarrStats large />
		{/if}
		{#if settings.globalSettings.sonarr.baseUrl}
			<SonarrStats large />
		{/if}
		{#if !settings.globalSettings.radarr.baseUrl && !settings.globalSettings.sonarr.baseUrl}
			<div class="col-span-full mb-64 flex flex-1 font-medium text-zinc-500">
				{$_('sources.empty')}
			</div>
		{/if}
	</div>
</div>
