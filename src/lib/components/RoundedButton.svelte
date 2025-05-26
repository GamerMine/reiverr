<script lang="ts">
	import classNames from 'classnames';
	import { ChevronRight } from 'radix-icons-svelte';
	import type { Snippet } from 'svelte';

	let {
		disableIcon = false,
		onclick,
		children,
		icon
	}: {
		disableIcon?: boolean;
		onclick: (e: MouseEvent) => void;
		children: Snippet;
		icon: Snippet;
	} = $props();
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<button
	class={classNames(
		'text-sm py-1 px-3 rounded-full flex items-center select-none cursor-pointer transition-colors selectable border',
		'border-zinc-600 text-zinc-300 hover:bg-zinc-100 hover:border-zinc-100 hover:text-zinc-800 focus-visible:bg-zinc-100 focus-visible:border-zinc-100 focus-visible:text-zinc-800'
	)}
	{onclick}
>
	<span>{@render children?.()}</span>
	{#if !disableIcon}
		{@render icon?.()}
		{#if !icon}
			<ChevronRight size={20} />
		{/if}
	{/if}
</button>

<!-- FIXME: Unused ?  -->
