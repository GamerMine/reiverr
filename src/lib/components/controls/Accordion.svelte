<script lang="ts">
	import { ChevronRight } from 'svelte-radix';
	import classNames from 'classnames';
	import type { Snippet } from 'svelte';
	import { slide } from 'svelte/transition';

	let {
		opened = $bindable(false),
		loading = false,

		summary = undefined,
		content = undefined
	}: {
		opened?: boolean;
		loading?: boolean;

		summary?: Snippet;
		content?: Snippet;
	} = $props();
</script>

<div>
	<button
		class={classNames(
			'block w-full cursor-pointer rounded-md bg-zinc-700 py-6 transition-colors duration-200 hover:bg-zinc-300 hover:text-black',
			{ 'animate-pulse cursor-default': loading }
		)}
		onclick={() => (opened = loading ? opened : !opened)}
	>
		<div class="mx-4 flex">
			<ChevronRight
				class={classNames('mr-2 rotate-0 transition-transform', { 'rotate-90': opened })}
			/>
			{@render summary?.()}
		</div>
	</button>
	{#if opened}
		<div transition:slide={{ duration: 200 }} class="bg-zinc-800 p-4">
			{@render content?.()}
		</div>
	{/if}
</div>
