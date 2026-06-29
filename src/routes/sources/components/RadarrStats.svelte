<script lang="ts">
	import { settings } from '$lib/stores/settings.svelte.js';
	import { formatSize } from '$lib/utils/utils.js';
	import RadarrIcon from '$lib/components/icons/RadarrIcon.svelte';
	import StatsContainer from './StatsContainer.svelte';
	import StatsPlaceholder from './StatsPlaceholder.svelte';
	import { radarrGetDiskspace, radarrGetMovies } from '$lib/remote/radarr.remote';

	let { large = false }: { large?: boolean } = $props();

	async function fetchStats() {
		const diskSpace = await radarrGetDiskspace();
		const radarrMovies = await radarrGetMovies();
		const availableMovies =
			radarrMovies.data?.filter((item) => item.isAvailable && item.movieFile) ?? [];

		const diskSpaceInfo =
			diskSpace.data?.find((disk) => disk.path === '/') || diskSpace.data?.[0] || undefined;

		const spaceOccupied = availableMovies.reduce(
			(acc, movie) => acc + (movie?.sizeOnDisk || 0),
			0
		);

		return {
			moviesCount: availableMovies.length,
			spaceLeft: diskSpaceInfo?.freeSpace || 0,
			spaceOccupied,
			spaceTotal: diskSpaceInfo?.totalSpace || 0
		};
	}
</script>

{#await fetchStats()}
	<StatsPlaceholder {large} />
{:then { moviesCount, spaceLeft, spaceOccupied, spaceTotal }}
	<StatsContainer
		{large}
		title="Radarr"
		subtitle="Movies Provider"
		href={settings.globalSettings.radarr.baseUrl || '#'}
		stats={[
			{ title: 'Movies', value: String(moviesCount) },
			{ title: 'Space Taken', value: formatSize(spaceOccupied) },
			{ title: 'Space Left', value: formatSize(spaceLeft) }
		]}
		fillPercentage={((spaceTotal - spaceLeft) / spaceTotal) * 100}
	>
		{#snippet icon()}
			<RadarrIcon class="absolute opacity-20 p-4 h-full inset-y-0 right-2" />
		{/snippet}
	</StatsContainer>
{/await}
