<script lang="ts">
	import { settings } from '$lib/stores/settings.svelte';
	import { formatSize } from '$lib/utils.js';
	import SonarrIcon from '../common/icons/SonarrIcon.svelte';
	import StatsContainer from './StatsContainer.svelte';
	import StatsPlaceholder from './StatsPlaceholder.svelte';
	import { sonarrGetDiskspace, sonarrGetSeries } from '$lib/remote/sonarr.remote';

	let { large = false }: { large?: boolean } = $props();

	async function fetchStats() {
		const diskSpace = await sonarrGetDiskspace();
		const sonarrSeries = await sonarrGetSeries();
		const availableSeries =
			sonarrSeries.data?.filter((item) => item.statistics?.episodeFileCount) || [];

		const diskSpaceInfo =
			diskSpace.data?.find((disk) => disk.path === '/') || diskSpace.data?.[0] || undefined;

		const spaceOccupied = availableSeries.reduce(
			(acc, series) => acc + (series?.statistics?.sizeOnDisk || 0),
			0
		);

		const episodesCount = availableSeries.reduce(
			(acc, series) => acc + (series?.statistics?.episodeFileCount || 0),
			0
		);

		return {
			episodesCount,
			spaceLeft: diskSpaceInfo?.freeSpace || 0,
			spaceOccupied,
			spaceTotal: diskSpaceInfo?.totalSpace || 0
		};
	}
</script>

{#await fetchStats()}
	<StatsPlaceholder {large} />
{:then { episodesCount, spaceLeft, spaceOccupied, spaceTotal }}
	<StatsContainer
		{large}
		title="Sonarr"
		subtitle="Shows Provider"
		href={settings.globalSettings.sonarr.baseUrl || '#'}
		stats={[
			{ title: 'Episodes', value: String(episodesCount) },
			{ title: 'Space Taken', value: formatSize(spaceOccupied) },
			{ title: 'Space Left', value: formatSize(spaceLeft) }
		]}
		fillPercentage={((spaceTotal - spaceLeft) / spaceTotal) * 100}
		color="#8aacfd21"
	>
		{#snippet icon()}
			<SonarrIcon class="absolute opacity-20 p-4 h-full inset-y-0 right-2" />
		{/snippet}
	</StatsContainer>
{/await}
