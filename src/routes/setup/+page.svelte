<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { ArrowRight, ArrowLeft } from 'svelte-radix';
	import { onMount } from 'svelte';
	import { animateBackground } from '$lib/utils/animation';

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
	});
</script>

<div bind:this={mainDiv} class="relative overflow-hidden h-screen">
	<div class="flex z-10 gap-2 rounded-xs items-center justify-center pt-20">
		<div class="rounded-full bg-amber-300 h-11 w-11"></div>
		<h1 class="font-display uppercase font-semibold tracking-wider text-5xl">Reiverr</h1>
	</div>
	<h1
		class="flex z-10 font-display font-semibold text-4xl items-center justify-center pt-10 w-screen"
	>
		Welcome!
	</h1>
	<div
		class="absolute z-10 items-center top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-stone-900/60 p-6 rounded-xl"
	>
		<h1 class="flex justify-center text-3xl pb-5">Bienvenue sur Reiverr !</h1>
		<p class="text-justify pb-5">
			Cet assistant va vous guider pas à pas, afin de configurer vos service et personnaliser votre
			expérience.
		</p>
		<p class="text-justify">
			Cliquez sur Suivant pour continuer la configuration. Tous les paramètres pourrons êtres
			modifiés ultérieurement.
		</p>
		<div class="flex justify-between pt-10">
			<div>
				<Button type="tertiary">
					<ArrowLeft size="20" /><span class="mr-1">Back</span>
				</Button>
			</div>
			<div>
				<Button type="secondary">
					<span class="mr-1">Next</span><ArrowRight size="20" />
				</Button>
			</div>
		</div>
	</div>
</div>
