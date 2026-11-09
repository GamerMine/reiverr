<script lang="ts">
	import classNames from 'classnames';
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';

	let {
		disabled = false,
		class: className = '',

		onclick,
		children
	}: {
		disabled?: boolean;
		class?: ClassValue;
		onclick?: (e: MouseEvent) => void;
		children: Snippet;
	} = $props();
</script>

<button
	class={classNames(
		'selectable flex shrink-0 items-center justify-center rounded-xs p-1 text-zinc-300 hover:text-zinc-50',
		{
			'pointer-events-none cursor-not-allowed opacity-30': disabled,
			'cursor-pointer': !disabled
		},
		className
	)}
	{onclick}
>
	{@render children?.()}
</button>
