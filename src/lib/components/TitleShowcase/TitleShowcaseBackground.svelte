<script lang="ts">
	import { TMDB_IMAGES_ORIGINAL } from '$lib/constants';
	import { settings } from '$lib/stores/settings.store';
	import classNames from 'classnames';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import YoutubePlayer from '../YoutubePlayer.svelte';

	const TRAILER_TIMEOUT = 3000;
	const TRAILER_LOAD_TIME = 1000;
	const ANIMATION_DURATION = $settings.animationDuration;

	let {
		tmdbId,
		lazyTrailerId,
		backdropUri,
		UIVisible = true
	}: {
		tmdbId: number;
		lazyTrailerId: Promise<string | undefined>;
		backdropUri: string;
		UIVisible?: boolean;
	} = $props();

	let scrollY: number = $state(0);
	let trailerMounted = $state(false);
	let trailerVisible = $state(false);
	let hoverTrailer = $state(false);

	$effect(() => {
		UIVisible = !(hoverTrailer && trailerVisible);
		tmdbId;
		trailerMounted = false;
		trailerVisible = false;
		UIVisible = true;

		showTrailerDelayed();
	});

	let trailerId: string | undefined = $state();
	lazyTrailerId.then((v) => (trailerId = v));

	let trailerShowTimeout: NodeJS.Timeout | undefined = undefined;

	function handleWindowScroll() {
		if (scrollY > 100) hideTrailer();
		else if (!trailerShowTimeout) showTrailerDelayed();
	}

	function hideTrailer() {
		clearTimeout(trailerShowTimeout);
		trailerShowTimeout = undefined;
		trailerVisible = false;
		trailerMounted = false;
	}

	function showTrailerDelayed() {
		if ($settings.autoplayTrailers === false) return;
		trailerShowTimeout = setTimeout(() => {
			trailerMounted = true; // Mount the trailer

			trailerShowTimeout = setTimeout(() => {
				trailerVisible = true;
				trailerShowTimeout = undefined;
			}, TRAILER_LOAD_TIME);
		}, TRAILER_TIMEOUT - TRAILER_LOAD_TIME);
	}

	onMount(() => {
		return () => clearTimeout(trailerShowTimeout);
	});
</script>

<svelte:window bind:scrollY on:scroll={handleWindowScroll} />

{#if !trailerVisible || !trailerId}
	{#key tmdbId}
		<div
			style={"background-image: url('" + TMDB_IMAGES_ORIGINAL + backdropUri + "');"}
			class={classNames('fixed inset-0 bg-cover bg-center z-[-1]')}
			in:fade={{ duration: ANIMATION_DURATION * 2 }}
			out:fade={{ duration: ANIMATION_DURATION * 2, delay: ANIMATION_DURATION }}
		></div>
	{/key}
{/if}
{#if trailerId && $settings.autoplayTrailers && trailerMounted}
	<div
		class={classNames('absolute inset-0 transition-opacity z-[-1]', {
			'opacity-100': trailerVisible,
			'opacity-0': !trailerVisible
		})}
		out:fade={{ duration: ANIMATION_DURATION }}
	>
		<YoutubePlayer videoId={trailerId} />
	</div>
{/if}
{#if UIVisible}
	<div
		class="absolute inset-0 bg-gradient-to-t from-stone-950 from-10% via-darken via-60% to-darken
		z-[-1]"
	></div>
{:else if !UIVisible}
	<div class="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-darken z-[-1]"></div>
{/if}
