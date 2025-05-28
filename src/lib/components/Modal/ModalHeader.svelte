<script lang="ts">
	import classNames from 'classnames';
	import IconButton from '../IconButton.svelte';
	import { ChevronLeft, Cross2 } from 'svelte-radix';
	import type { Snippet } from 'svelte';

	let {
		close = () => {},
		back = undefined,
		text = back ? 'Back' : '',

		children = undefined
	}: { close?: () => void; back?: () => void; text?: string; children?: Snippet } = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="flex text-zinc-200 items-center p-3 px-5 gap-4 border-b border-zinc-700">
	{@render children?.()}
	{#if !children}
		{#if text}
			<button
				class={classNames('flex-1 flex items-center gap-1', {
					'cursor-pointer text-zinc-300 hover:text-zinc-200': !!back,
					'cursor-default': !back
				})}
				onclick={() => back?.()}
				tabindex={back ? 0 : -1}
			>
				{#if !!back}
					<ChevronLeft size="20" />
				{/if}
				<h1 class="font-medium">{text}</h1>
			</button>
		{/if}
	{/if}
	<IconButton onclick={close}>
		<Cross2 size="20" />
	</IconButton>
</div>
