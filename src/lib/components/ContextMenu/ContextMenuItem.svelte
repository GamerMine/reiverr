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
		'text-sm font-medium tracking-wide px-3 py-1 hover:bg-zinc-200/10 rounded-md text-left cursor-default',
		{
			'opacity-75 pointer-events-none': disabled
		}
	)}
>
	{@render children?.()}
</button>
