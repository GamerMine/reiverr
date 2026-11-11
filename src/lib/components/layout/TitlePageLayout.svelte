<script lang="ts">
	import {
		PLACEHOLDER_BACKDROP,
		TMDB_IMAGES_ORIGINAL,
		TMDB_POSTER_SMALL
	} from '#lib/utils/constants.js';
	import type { TitleType } from '#lib/utils/types.js';
	import classNames from 'classnames';
	import { ChevronLeft, Cross2, ExternalLink } from 'svelte-radix';
	import IconButton from '#lib/components/controls/IconButton.svelte';
	import LazyImg from '#lib/components/images/LazyImg.svelte';
	import TruncatedText from '#lib/components/text/TruncatedText.svelte';
	import type { Snippet } from 'svelte';

	interface titleInformation {
		tmdbId: number;
		type: TitleType;
		title: string;
		tagline: string;
		overview: string;
		backdropUriCandidates?: string[];
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
	class={classNames('inset-x-0 hidden bg-stone-950 bg-cover bg-center sm:block', {
		absolute: isModal,
		fixed: !isModal
	})}
>
	{#if titleInformation}
		<LazyImg
			src={titleInformation.backdropUriCandidates
				? TMDB_IMAGES_ORIGINAL + getBackdropUri(titleInformation.backdropUriCandidates)
				: PLACEHOLDER_BACKDROP}
			klass="h-full"
		>
			<div class="bg-darken absolute inset-0"></div>
		</LazyImg>
	{/if}
</div>

<!-- Mobile -->
<div
	style={'height: ' + imageHeight.toFixed() + 'px'}
	class="fixed inset-x-0 bg-stone-950 bg-cover bg-center sm:hidden"
>
	{#if titleInformation}
		<LazyImg src={TMDB_IMAGES_ORIGINAL + titleInformation.posterPath} klass="h-full">
			<div class="bg-darken absolute inset-0"></div>
		</LazyImg>
	{/if}
</div>

<div class="flex min-h-screen flex-col">
	<div
		class={classNames('relative z-1 flex flex-col', {
			'h-[85vh] sm:h-screen': !isModal,
			'': isModal
		})}
	>
		<div
			class={classNames('relative flex flex-1 px-2 pt-24 pb-6 sm:px-4 lg:px-8', {
				'min-h-[60vh]': isModal
			})}
			bind:clientHeight={topHeight}
		>
			{#if isModal}
				{#if titleInformation}
					<a
						href={`/${titleInformation.type}/${titleInformation.tmdbId}`}
						class="absolute top-8 right-4 z-10 duration-300 ease-in-out hover:rounded-4xl hover:bg-white/15 sm:right-8"
					>
						<IconButton>
							<ExternalLink size="20" />
						</IconButton>
					</a>
				{/if}
				<div class="absolute top-8 left-4 z-10 sm:left-8">
					<button
						class="flex items-center font-medium sm:hidden"
						onclick={handleCloseModal}
					>
						<ChevronLeft size="20" />
						Back
					</button>
					<div
						class="hidden duration-300 ease-in-out hover:rounded-4xl hover:bg-white/15 sm:block"
					>
						<IconButton onclick={handleCloseModal}>
							<Cross2 size="20" />
						</IconButton>
					</div>
				</div>
			{/if}
			<div class="absolute inset-0 bg-linear-to-t from-stone-950 to-30%"></div>
			<div class="z-1 mx-auto flex max-w-screen-2xl flex-1 items-end justify-end gap-8">
				{#if titleInformation}
					<div
						class="hidden aspect-2/3 w-52 rounded-md bg-cover bg-center sm:block"
						style={"background-image: url('" +
							TMDB_POSTER_SMALL +
							titleInformation.posterPath +
							"')"}
					></div>
				{:else}
					<div
						class="placeholder hidden aspect-2/3 w-52 rounded-md bg-cover bg-center sm:block"
					></div>
				{/if}
				<div class="flex flex-1 flex-col justify-between gap-4 lg:flex-row lg:items-end">
					<div>
						<div
							class="flex items-center gap-1 text-sm font-semibold text-zinc-300 uppercase"
						>
							{@render title_info?.()}
							{#if !title_info}
								<div class="placeholder-text">Placeholder Long</div>
							{/if}
						</div>
						{#if titleInformation}
							<h1 class="text-4xl font-semibold sm:text-5xl md:text-6xl">
								{titleInformation.title}
							</h1>
						{:else}
							<h1 class="placeholder-text mt-2 text-4xl sm:text-5xl md:text-6xl">
								Placeholder
							</h1>
						{/if}
					</div>
					<div class="shrink-0">
						{@render title_right?.()}
					</div>
				</div>
			</div>
		</div>
		<div bind:clientHeight={bottomHeight} class="bg-stone-950 pb-6">
			<div class="mx-auto max-w-screen-2xl">
				{@render episodes_carousel?.()}
			</div>
		</div>
	</div>

	<div
		class={classNames(
			'relative flex flex-1 flex-col gap-6 bg-stone-950 px-2 pb-6 sm:px-4 lg:px-8',
			{
				'2xl:px-0': !isModal
			}
		)}
	>
		<div
			class="grid max-w-screen-2xl grid-cols-4 gap-4 rounded-xl py-4 sm:grid-cols-6 sm:gap-x-8 2xl:mx-auto"
		>
			{@render info_description?.()}
			{#if !info_description}
				<div
					class="col-span-4 row-span-3 mb-4 flex max-w-5xl flex-col gap-3 sm:col-span-6 lg:col-span-3 lg:mr-8"
				>
					<!-- TODO: If there is no overview text available for a language, try getting it in another language -->
					{#if titleInformation}
						<div class="flex justify-between gap-4">
							<h1 class="text-xl font-semibold sm:text-2xl">
								{titleInformation.tagline}
							</h1>
						</div>
						<TruncatedText
							class="border-l-2 pl-4 text-sm text-zinc-300 sm:text-base"
							text={titleInformation.overview}
						/>
					{:else}
						<div class="flex justify-between gap-4">
							<h1 class="placeholder-text text-xl font-semibold sm:text-2xl">
								Placeholder
							</h1>
						</div>
						<div class="flex">
							<div class="placeholder mr-4 w-1 shrink-0 rounded-sm"></div>
							<p class="placeholder-text text-sm sm:text-base">
								Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur
								sit amet sem eget dolor lobortis mollis. Aliquam semper imperdiet mi
								nec viverra. Praesent ac ligula congue, aliquam diam nec,
								ullamcorper libero. Nunc mattis rhoncus justo, ac pretium urna
								vehicula et.
							</p>
						</div>
					{/if}
				</div>
			{/if}
			{@render info_components?.()}
			{@render servarr_components?.()}
			{#if !servarr_components}
				<div class="col-span-4 mt-4 flex flex-wrap gap-4 sm:col-span-6">
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
