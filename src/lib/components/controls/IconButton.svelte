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
		'text-zinc-300 hover:text-zinc-50 p-1 flex items-center justify-center selectable rounded-xs shrink-0',
		{
			'opacity-30 cursor-not-allowed pointer-events-none': disabled,
			'cursor-pointer': !disabled
		},
		className
	)}
	{onclick}
>
	{@render children?.()}
</button>
