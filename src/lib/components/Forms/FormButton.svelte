<script lang="ts">
	import classNames from 'classnames';
	import { Update } from 'svelte-radix';
	import type { Snippet } from 'svelte';

	let {
		type = 'base',
		loading = false,
		disabled = false,

		klass = '',

		children,

		onclick = (_) => {}
	}: {
		type?: 'base' | 'success' | 'error';
		loading?: boolean;
		disabled?: boolean;

		klass?: string;

		children?: Snippet;

		onclick?: (event: MouseEvent) => void;
	} = $props();
</script>

<button
	{onclick}
	class={classNames(
		'p-1.5 px-4 text-sm text-zinc-200 rounded-lg border',
		'hover:bg-opacity-30 transition-colors',
		'flex items-center gap-2',
		{
			'bg-green-500/20 text-green-200 border-green-900': type === 'success',
			'bg-red-500/20 text-red-200 border-red-900': type === 'error',
			'bg-zinc-600/20 border-zinc-800': type === 'base',
			'cursor-not-allowed opacity-75 pointer-events-none': disabled || loading
		},
		klass
	)}
>
	{#if loading}
		<Update class="animate-spin" size="14" />
	{/if}
	{@render children?.()}
</button>
