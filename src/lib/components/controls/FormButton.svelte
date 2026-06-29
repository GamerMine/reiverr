<script lang="ts">
	import classNames from 'classnames';
	import { Update } from 'svelte-radix';
	import type { Snippet } from 'svelte';

	let {
		type = 'base',
		loading = false,
		disabled = false,
		name = undefined,
		value = undefined,

		klass = '',

		children,

		onclick = () => {}
	}: {
		type?: 'base' | 'success' | 'error';
		loading?: boolean;
		disabled?: boolean;
		name?: string;
		value?: string | number;

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
		'flex items-center gap-2 justify-center',
		{
			'bg-green-500/20 text-green-200 border-green-900': type === 'success',
			'bg-red-500/20 text-red-200 border-red-900': type === 'error',
			'bg-white text-zinc-900 font-extrabold': type === 'base',
			'hover:bg-amber-400 focus-within:bg-amber-400 hover:border-amber-400 focus-within:border-amber-400':
				type === 'base' && !disabled,
			'cursor-not-allowed opacity-75 pointer-events-none': disabled || loading
		},
		klass
	)}
	{name}
	{value}
>
	{#if loading}
		<Update class="animate-spin" size="14" />
	{:else}
		{@render children?.()}
	{/if}
</button>
