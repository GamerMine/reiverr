<script lang="ts">
	import classNames from 'classnames';
	import type { Snippet } from 'svelte';

	let {
		disabled = false,
		onclick,
		children
	}: { disabled?: boolean; onclick: (e: MouseEvent) => void; children: Snippet } = $props();
</script>

<button
	{onclick}
	class={classNames(
		'cursor-default rounded-md px-3 py-1 text-left text-sm font-medium tracking-wide hover:bg-zinc-200/10',
		{
			'pointer-events-none opacity-75': disabled
		}
	)}
>
	{@render children?.()}
</button>
