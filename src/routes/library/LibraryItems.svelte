<script lang="ts">
	import UiCarousel from '$lib/components/Carousel/UICarousel.svelte';
	import IconButton from '$lib/components/IconButton.svelte';
	import classNames from 'classnames';
	import { fly } from 'svelte/transition';
	import { _ } from 'svelte-i18n';
	import { ChevronDown, Cross2, MagnifyingGlass } from 'svelte-radix';
	import CardPlaceholder from '$lib/components/Card/CardPlaceholder.svelte';
	import { tick, type ComponentProps } from 'svelte';
	import Poster from '$lib/components/Poster/Poster.svelte';
	import { getJellyfinPosterUrl, type JellyfinItem } from '$lib/apis/jellyfin/jellyfinApi';
	import { getRadarrPosterUrl, type RadarrMovie } from '$lib/apis/radarr/radarrApi';
	import { getSonarrPosterUrl, type SonarrSeries } from '$lib/apis/sonarr/sonarrApi';
	import { jellyfinItemsStore, radarrMoviesStore, sonarrSeriesStore } from '$lib/stores/data.store';
	import Button from '$lib/components/Button.svelte';
	import ContextMenu from '$lib/components/ContextMenu/ContextMenu.svelte';
	import SelectableContextMenuItem from '$lib/components/ContextMenu/SelectableContextMenuItem.svelte';
	import ContextMenuDivider from '$lib/components/ContextMenu/ContextMenuDivider.svelte';
	import { createLocalStorageStore } from '$lib/stores/localstorage.store';

	const SortBy = {
		DateAdded: $_('library.sort.dateAdded'),
		Rating: $_('library.sort.rating'),
		ReleaseDate: $_('library.sort.releaseDate'),
		Size: $_('library.sort.size'),
		Name: $_('library.sort.name')
	};

	const SortOrder = {
		Ascending: $_('library.sort.ascending'),
		Descending: $_('library.sort.descending')
	};

	const PAGE_SIZE = 100;

	let itemsVisible: 'all' | 'movies' | 'shows' = 'all';
	const sortBy = createLocalStorageStore<string>('library-sort-by', SortBy.DateAdded);
	const sortOrder = createLocalStorageStore<string>('library-sort-order', SortOrder.Descending);
	let searchQuery = $state('');

	let openTab: 'available' | 'watched' | 'unavailable' = $state('available');
	let page = $state(0);

	let searchVisible = $state(false);

	let searchInput: HTMLInputElement | undefined = $state();

	let libraryLoading = $state(true);
	let posterProps: ComponentProps<typeof Poster>[] = $state([]);
	let hasMore = $state(true);
	$effect(() => {
		loadPosterProps(openTab, page, $sortBy, $sortOrder, searchQuery);
	});

	function getPropsFromJellyfinItem(item: JellyfinItem): ComponentProps<typeof Poster> {
		return {
			tmdbId: Number(item.ProviderIds?.Tmdb) || 0,
			jellyfinId: item.Id,
			title: item.Name || undefined,
			subtitle: item.Genres?.join(', ') || undefined,
			backdropUrl: getJellyfinPosterUrl(item, 80),
			size: 'dynamic',
			...(item.Type === 'Movie' ? { type: 'movie' } : { type: 'series' }),
			orientation: 'portrait',
			rating: item.CommunityRating || undefined
		};
	}

	function getPropsfromServarrItem(
		item: RadarrMovie | SonarrSeries
	): ComponentProps<typeof Poster> {
		if ((<any>item)?.tmdbId) {
			const movie = item as RadarrMovie;

			return {
				tmdbId: movie.tmdbId || 0,
				title: movie.title || undefined,
				subtitle: movie.genres?.join(', ') || undefined,
				backdropUrl: getRadarrPosterUrl(movie),
				size: 'dynamic',
				type: 'movie',
				orientation: 'portrait',
				rating: movie.ratings?.tmdb?.value || undefined
			};
		} else {
			const series = item as SonarrSeries;

			return {
				tvdbId: series.tvdbId || 0,
				title: item.title || undefined,
				subtitle: item.genres?.join(', ') || undefined,
				backdropUrl: getSonarrPosterUrl(series),
				size: 'dynamic',
				type: 'series',
				tmdbId: undefined,
				orientation: 'portrait',
				rating: series.ratings?.value || undefined
			};
		}
	}

	async function loadPosterProps(
		tab: typeof openTab,
		page: number,
		sort: string,
		order: string,
		searchQuery: string
	) {
		if (page === 0) posterProps = [];

		const jellyfinItemsPromise = jellyfinItemsStore.promise
			.then((i) => i.filter((i) => i.Name?.toLowerCase().includes(searchQuery.toLowerCase())) || [])
			.then((i) => {
				const sorted = i.sort((a, b) => {
					if (sort === SortBy.DateAdded) {
						return new Date(b.DateCreated || 0).getTime() - new Date(a.DateCreated || 0).getTime();
					} else if (sort === SortBy.Rating) {
						return (b.CommunityRating || 0) - (a.CommunityRating || 0);
					} else if (sort === SortBy.ReleaseDate) {
						return (
							new Date(b.PremiereDate || 0).getTime() - new Date(a.PremiereDate || 0).getTime()
						);
					} else if (sort === SortBy.Size) {
						return (b.RunTimeTicks || 0) - (a.RunTimeTicks || 0);
					} else if (sort === SortBy.Name) {
						return (b.Name || '').localeCompare(a.Name || '');
					} else {
						return 0;
					}
				});

				if (order === SortOrder.Ascending) {
					return sorted.reverse();
				} else {
					return sorted;
				}
			});

		let props: ComponentProps<typeof Poster>[] = [];

		if (tab === 'available') {
			props = await jellyfinItemsPromise.then((items) =>
				items.filter((i) => !i.UserData?.Played).map((item) => getPropsFromJellyfinItem(item))
			);
		} else if (tab === 'watched') {
			props = await jellyfinItemsPromise.then((items) =>
				items.filter((i) => i.UserData?.Played).map((item) => getPropsFromJellyfinItem(item))
			);
		} else if (tab === 'unavailable') {
			props = await Promise.all([
				radarrMoviesStore.promise,
				sonarrSeriesStore.promise,
				jellyfinItemsPromise
			])
				.then(([radarr, sonarr, jellyfinItems]) => ({
					items: [...radarr, ...sonarr],
					jellyfinItems
				}))
				.then(({ items, jellyfinItems }) =>
					items
						.filter((i) => i.title?.toLowerCase().includes(searchQuery.toLowerCase()))
						.filter(
							(i) =>
								!jellyfinItems.find((j) => j.ProviderIds?.Tmdb === String((<any>i).tmdbId || '-'))
						)
						.filter(
							(i) =>
								!jellyfinItems.find((j) => j.ProviderIds?.Tvdb === String((<any>i).tvdbId || '-'))
						)
						.map((i) => getPropsfromServarrItem(i))
				);
		}

		const toAdd = props.slice(PAGE_SIZE * page, PAGE_SIZE * (page + 1));

		hasMore = toAdd.length === PAGE_SIZE;
		libraryLoading = false;
		posterProps = [...posterProps, ...toAdd];
	}

	function handleTabChange(tab: typeof openTab) {
		openTab = tab;
		page = 0;
	}

	async function handleOpenSearch() {
		searchVisible = true;
		await tick();
		searchInput?.focus();
	}

	async function handleCloseSearch() {
		searchVisible = false;
		searchQuery = '';
	}

	async function handleShortcuts(event: KeyboardEvent) {
		if (event.key === 'f' && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			await handleOpenSearch();
		} else if (event.key === 'Escape') {
			await handleCloseSearch();
		}
	}
</script>

<svelte:window on:keydown={handleShortcuts} />

{#if searchVisible}
	<div
		transition:fly={{ y: 5, duration: 200 }}
		class="fixed top-20 left-1/2 w-80 -ml-40 z-10 bg-[#33333388] backdrop-blur-xl rounded-full
		flex items-center text-zinc-300"
	>
		<div class="absolute inset-y-0 left-4 flex items-center justify-center">
			<MagnifyingGlass size="20" />
		</div>
		<div class="absolute inset-y-0 right-4 flex items-center justify-center">
			<IconButton onclick={handleCloseSearch}>
				<Cross2 size="20" />
			</IconButton>
		</div>
		<input
			bind:this={searchInput}
			bind:value={searchQuery}
			placeholder={$_('library.search')}
			class="appearance-none mx-2.5 my-2.5 px-10 bg-transparent outline-hidden placeholder:text-zinc-400 font-medium w-full"
		/>
	</div>
{/if}

<div class="flex flex-col gap-4">
	<div class="flex items-center justify-between gap-4">
		<UiCarousel>
			<div class="flex gap-6 text-lg font-medium text-zinc-400">
				<button
					class={classNames('hover:text-zinc-300 selectable rounded-sm px-1 -mx-1', {
						'text-zinc-200': openTab === 'available'
					})}
					onclick={() => handleTabChange('available')}
				>
					{$_('library.available')}
				</button>
				<button
					class={classNames('hover:text-zinc-300 selectable rounded-sm px-1 -mx-1', {
						'text-zinc-200': openTab === 'watched'
					})}
					onclick={() => handleTabChange('watched')}
				>
					{$_('library.watched')}
				</button>
				<button
					class={classNames('hover:text-zinc-300 selectable rounded-sm px-1 -mx-1', {
						'text-zinc-200': openTab === 'unavailable'
					})}
					onclick={() => handleTabChange('unavailable')}
				>
					{$_('library.unavailable')}
				</button>
			</div>
		</UiCarousel>
		<div class="flex items-center gap-3 justify-end shrink-0 flex-initial relative">
			<ContextMenu heading={$_('library.sort.sortBy')} position="absolute">
				{#snippet menu()}
					{#each Object.values(SortBy) as sortOption}
						<SelectableContextMenuItem
							selected={$sortBy === sortOption}
							onclick={() => {
								sortBy.set(sortOption);
								page = 0;
							}}
						>
							{sortOption}
						</SelectableContextMenuItem>
					{/each}
					<ContextMenuDivider />
					{#each Object.values(SortOrder) as order}
						<SelectableContextMenuItem
							selected={$sortOrder === order}
							onclick={() => {
								sortOrder.set(order);
								page = 0;
							}}
						>
							{order}
						</SelectableContextMenuItem>
					{/each}
				{/snippet}
				<IconButton>
					<div class="flex gap-1 items-center">
						{$sortBy}
						<ChevronDown size="20" />
					</div>
				</IconButton>
			</ContextMenu>
			<IconButton onclick={handleOpenSearch}>
				<MagnifyingGlass size="20" />
			</IconButton>
		</div>
	</div>

	<div
		class="grid gap-x-4 gap-y-4 sm:gap-y-8 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7"
	>
		{#if libraryLoading}
			{#each [...Array(20).keys()] as index (index)}
				<CardPlaceholder orientation="portrait" size="dynamic" {index} />
			{/each}
		{:else}
			{#each posterProps.slice(0, PAGE_SIZE + page * PAGE_SIZE) as prop}
				<Poster {...prop} />
			{:else}
				<div class="flex-1 flex font-medium text-zinc-500 col-span-full mb-64">
					{openTab === 'available'
						? 'Your Jellyfin library items will appear here.'
						: openTab === 'watched'
							? 'Your watched Jellyfin items will appear here.'
							: "Your Radarr and Sonarr items that aren't available will appear here."}
				</div>
			{/each}
		{/if}
	</div>

	{#if !libraryLoading && posterProps.length > 0}
		<div class="mx-auto my-4">
			<Button onclick={() => (page = page + 1)} disabled={!hasMore}>{$_('library.loadMore')}</Button
			>
		</div>
	{/if}
</div>
