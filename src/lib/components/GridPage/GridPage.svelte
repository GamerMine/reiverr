<script lang="ts">
	import { ChevronLeft } from 'radix-icons-svelte';
	import CardGrid from '../Card/CardGrid.svelte';
	import CardPlaceholder from '../Card/CardPlaceholder.svelte';
	import { capitalize } from '$lib/utils';
	import type { Snippet } from 'svelte';

	let { title, children = undefined }: { title: string; children?: Snippet } = $props();
</script>

<div class="pt-24 p-8 bg-black">
	<div class="flex flex-col gap-1 items-start">
		<button
			class="flex items-center cursor-pointer hover:text-zinc-200 text-zinc-400 transition-colors"
			onclick={() => window?.history?.back()}
		>
			<ChevronLeft size={18} />
			<h2 class="text-sm">Back</h2>
		</button>
		<h1 class="font-bold text-5xl">{capitalize(title)}</h1>
	</div>
</div>

<div class="p-8">
	<CardGrid>
		{@render children?.()}
		{#if !children}
			{#each [...Array(20).keys()] as index (index)}
				<CardPlaceholder size="dynamic" {index} />
			{/each}
		{/if}
	</CardGrid>
</div>
