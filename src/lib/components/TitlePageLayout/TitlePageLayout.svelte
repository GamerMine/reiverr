<script lang="ts">
	import { TMDB_IMAGES_ORIGINAL, TMDB_POSTER_SMALL } from '$lib/constants';
	import type { TitleType } from '$lib/types';
	import classNames from 'classnames';
	import { ChevronLeft, Cross2, ExternalLink } from 'svelte-radix';
	import IconButton from '../IconButton.svelte';
	import LazyImg from '../LazyImg.svelte';
	import TruncatedText from '../TruncatedText.svelte';
	import type { Snippet } from 'svelte';

	interface titleInformation {
		tmdbId: number;
		type: TitleType;
		title: string;
		tagline: string;
		overview: string;
		backdropUriCandidates: string[];
		posterPath: string;
	}

	let {
		isModal = false,
		handleCloseModal = () => {},
		titleInformation = undefined,

		title_info = undefined,
		title_right = undefined,
		episodes_carousel = undefined,
		info_description = undefined,
		info_components = undefined,
		servarr_components = undefined,
		carousels = undefined
	}: {
		isModal?: boolean;
		handleCloseModal: () => void;
		titleInformation?: titleInformation;

		title_info?: Snippet;
		title_right?: Snippet;
		episodes_carousel?: Snippet;
		info_description?: Snippet;
		info_components?: Snippet;
		servarr_components?: Snippet;
		carousels?: Snippet;
	} = $props();

	let topHeight: number = $state(0);
	let bottomHeight: number = $state(0);
	let windowHeight: number = $state(0);
	let imageHeight: number = $state(0);
	$effect(() => {
		imageHeight = isModal && topHeight ? topHeight : windowHeight - bottomHeight * 0.3;
	});

	function getBackdropUri(uris: string[]) {
		return uris[Math.max(2, Math.floor(uris.length / 8))] || uris[uris.length - 1] || '';
	}
</script>

<svelte:window bind:outerHeight={windowHeight} />

<!-- Desktop -->
<div
	style={'height: ' + imageHeight.toFixed() + 'px'}
	class={classNames('hidden sm:block inset-x-0 bg-center bg-cover bg-stone-950', {
		absolute: isModal,
		fixed: !isModal
	})}
>
	{#if titleInformation}
		<LazyImg
			src={TMDB_IMAGES_ORIGINAL + getBackdropUri(titleInformation.backdropUriCandidates)}
			klass="h-full"
		>
			<div class="absolute inset-0 bg-darken"></div>
		</LazyImg>
	{/if}
</div>

<!-- Mobile -->
<div
	style={'height: ' + imageHeight.toFixed() + 'px'}
	class="sm:hidden fixed inset-x-0 bg-center bg-cover bg-stone-950"
>
	{#if titleInformation}
		<LazyImg src={TMDB_IMAGES_ORIGINAL + titleInformation.posterPath} klass="h-full">
			<div class="absolute inset-0 bg-darken"></div>
		</LazyImg>
	{/if}
</div>

<div class="flex flex-col min-h-screen">
	<div
		class={classNames('flex flex-col relative z-[1]', {
			'h-[85vh] sm:h-screen': !isModal,
			'': isModal
		})}
	>
		<div
			class={classNames('flex-1 relative flex pt-24 px-2 sm:px-4 lg:px-8 pb-6', {
				'min-h-[60vh]': isModal
			})}
			bind:clientHeight={topHeight}
		>
			{#if isModal}
				{#if titleInformation}
					<a
						href={`/${titleInformation.type}/${titleInformation.tmdbId}`}
						class="absolute top-8 right-4 sm:right-8 z-10 hover:bg-white/15 hover:rounded-4xl ease-in-out duration-300"
					>
						<IconButton>
							<ExternalLink size="20" />
						</IconButton>
					</a>
				{/if}
				<div class="absolute top-8 left-4 sm:left-8 z-10">
					<button class="flex items-center sm:hidden font-medium" onclick={handleCloseModal}>
						<ChevronLeft size="20" />
						Back
					</button>
					<div class="hidden sm:block hover:bg-white/15 hover:rounded-4xl ease-in-out duration-300">
						<IconButton onclick={handleCloseModal}>
							<Cross2 size="20" />
						</IconButton>
					</div>
				</div>
			{/if}
			<div class="absolute inset-0 bg-gradient-to-t from-stone-950 to-30%"></div>
			<div class="z-[1] flex-1 flex justify-end gap-8 items-end max-w-screen-2xl mx-auto">
				{#if titleInformation}
					<div
						class="aspect-[2/3] w-52 bg-center bg-cover rounded-md hidden sm:block"
						style={"background-image: url('" +
							TMDB_POSTER_SMALL +
							titleInformation.posterPath +
							"')"}
					></div>
				{:else}
					<div
						class="aspect-[2/3] w-52 bg-center bg-cover rounded-md hidden sm:block placeholder"
					></div>
				{/if}
				<div class="flex-1 flex gap-4 justify-between flex-col lg:flex-row lg:items-end">
					<div>
						<div class="text-zinc-300 text-sm uppercase font-semibold flex items-center gap-1">
							{@render title_info?.()}
							{#if !title_info}
								<div class="placeholder-text">Placeholder Long</div>
							{/if}
						</div>
						{#if titleInformation}
							<h1 class="text-4xl sm:text-5xl md:text-6xl font-semibold">
								{titleInformation.title}
							</h1>
						{:else}
							<h1 class="text-4xl sm:text-5xl md:text-6xl placeholder-text mt-2">Placeholder</h1>
						{/if}
					</div>
					<div class="shrink-0">
						{@render title_right?.()}
					</div>
				</div>
			</div>
		</div>
		<div bind:clientHeight={bottomHeight} class="pb-6 bg-stone-950">
			<div class="max-w-screen-2xl mx-auto">
				{@render episodes_carousel?.()}
			</div>
		</div>
	</div>

	<div
		class={classNames(
			'flex-1 flex flex-col gap-6 bg-stone-950 px-2 sm:px-4 lg:px-8 pb-6 relative',
			{
				'2xl:px-0': !isModal
			}
		)}
	>
		<div
			class="grid grid-cols-4 sm:grid-cols-6 gap-4 sm:gap-x-8 rounded-xl py-4 max-w-screen-2xl 2xl:mx-auto"
		>
			{@render info_description?.()}
			{#if !info_description}
				<div
					class="flex flex-col gap-3 max-w-5xl row-span-3 col-span-4 sm:col-span-6 lg:col-span-3 mb-4 lg:mr-8"
				>
					<!-- TODO: If there is no overview text available for a language, try getting it in another language -->
					{#if titleInformation}
						<div class="flex gap-4 justify-between">
							<h1 class="font-semibold text-xl sm:text-2xl">{titleInformation.tagline}</h1>
						</div>
						<TruncatedText
							klass="pl-4 border-l-2 text-sm sm:text-base text-zinc-300"
							text={titleInformation.overview}
						/>
					{:else}
						<div class="flex gap-4 justify-between">
							<h1 class="font-semibold text-xl sm:text-2xl placeholder-text">Placeholder</h1>
						</div>
						<div class="flex">
							<div class="mr-4 placeholder w-1 shrink-0 rounded-sm"></div>
							<p class="text-sm sm:text-base placeholder-text">
								Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur sit amet sem eget
								dolor lobortis mollis. Aliquam semper imperdiet mi nec viverra. Praesent ac ligula
								congue, aliquam diam nec, ullamcorper libero. Nunc mattis rhoncus justo, ac pretium
								urna vehicula et.
							</p>
						</div>
					{/if}
				</div>
			{/if}
			{@render info_components?.()}
			{@render servarr_components?.()}
			{#if !servarr_components}
				<div class="flex gap-4 flex-wrap col-span-4 sm:col-span-6 mt-4">
					<div class="placeholder h-10 w-40 rounded-xl"></div>
					<div class="placeholder h-10 w-40 rounded-xl"></div>
				</div>
			{/if}
		</div>
		<div class={classNames('max-w-screen-2xl', !isModal && 'self-center')}>
			{@render carousels?.()}
		</div>
	</div>
</div>
