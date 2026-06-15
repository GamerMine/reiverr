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
	<a
		class={classNames(
			'block bg-zinc-700 py-6 rounded-md cursor-pointer hover:bg-amber-300 hover:text-black transition-colors duration-200',
			{ 'cursor-default animate-pulse': loading }
		)}
		onclick={() => (opened = loading ? opened : !opened)}
	>
		<div class="flex mx-4">
			<ChevronRight
				class={classNames('rotate-0 transition-transform mr-2', { 'rotate-90': opened })}
			/>
			{@render summary?.()}
		</div>
	</a>
	{#if opened}
		<div transition:slide={{ duration: 200 }} class="bg-zinc-800 p-4">
			{@render content?.()}
		</div>
	{/if}
</div>
