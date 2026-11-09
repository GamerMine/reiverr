<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { animateBackground } from '#lib/utils/animation.ts';
	import { setTmpLanguage } from '#lib/utils/utils.ts';

	let { children }: { children: Snippet } = $props();

	let mainDiv: HTMLDivElement | undefined = $state();

	onMount(() => {
		if (mainDiv) {
			animateBackground(mainDiv);
			setTimeout(() => {
				if (mainDiv) {
					animateBackground(mainDiv);
				}
			}, 2000);
			setTimeout(() => {
				if (mainDiv) {
					animateBackground(mainDiv);
				}
			}, 5000);
		}
		setTmpLanguage(navigator.language);
	});
</script>

<div bind:this={mainDiv} class="relative h-screen overflow-hidden">
	<main>
		{@render children?.()}
	</main>
</div>
