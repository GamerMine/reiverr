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
		'rounded-lg border p-1.5 px-4 text-sm text-zinc-200',
		'hover:bg-opacity-30 transition-colors',
		'flex items-center justify-center gap-2',
		{
			'border-green-900 bg-green-500/20 text-green-200': type === 'success',
			'border-red-900 bg-red-500/20 text-red-200': type === 'error',
			'bg-white font-extrabold text-zinc-900': type === 'base',
			'focus-within:border-amber-400 focus-within:bg-purple-500 hover:border-amber-400 hover:bg-purple-500':
				type === 'base' && !disabled,
			'pointer-events-none cursor-not-allowed opacity-75': disabled || loading
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
