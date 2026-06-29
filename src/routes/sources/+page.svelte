<script lang="ts">
	import RadarrStats from './components/RadarrStats.svelte';
	import SonarrStats from './components/SonarrStats.svelte';
	import { fade } from 'svelte/transition';
	import { settings } from '$lib/stores/settings.svelte';
</script>

<div
	class="pt-24 px-8 min-h-screen flex justify-center"
	in:fade|global={{
		duration: settings.userSettings.interface.animationDuration,
		delay: settings.userSettings.interface.animationDuration
	}}
	out:fade|global={{ duration: settings.userSettings.interface.animationDuration }}
>
	<div class="flex flex-col gap-4 max-w-3xl flex-1">
		<RadarrStats large />
		<SonarrStats large />
		<!-- <div
			class="border-zinc-800 border-2 border-dashed relative w-full p-3 px-4 rounded-xl overflow-hidden text-zinc-500 text-center flex flex-col gap-1"
		>
			<h2 class="font-medium">Sonarr is not set up</h2>
			<p class="text-sm">
				To set up Sonarr, define the <code>PUBLIC_SONARR_API_KEY</code> and <code>SONARR_URL</code> environment
				variables.
			</p>
		</div> -->
	</div>
	<!--	<div>Sources</div>-->
	<!--	<div>Streaming services</div>-->
	<!--	<div>(P2P network?)</div>-->
	<!--	<div>Configure Sonarr</div>-->
	<!--	<div>Configure Radarr</div>-->
	<!--	<div>(Configure Plex)</div>-->
	<!--	<div>(Configure Jellyfinn)</div>-->
	<!--	<div>(Configure IMDB)</div>-->
	<!--	<div>(Configure TMDB)</div>-->
</div>
