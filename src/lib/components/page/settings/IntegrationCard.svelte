<script lang="ts">
	import classNames from 'classnames';
	import type { Snippet } from 'svelte';

	let {
		title,
		href = '#',
		status = 'disconnected',

		children
	}: {
		title: string;
		href?: string;
		status?: 'connected' | 'disconnected' | 'error';

		children: Snippet;
	} = $props();
</script>

<div
	class={classNames('border border-zinc-800 rounded-xl p-4 flex flex-col gap-4', {
		// 'border-zinc-800': status === 'connected'
		// 'border-zinc-800': status === 'disconnected'
	})}
>
	<div class="flex items-baseline justify-between">
		<a class="text-zinc-200 text-xl font-medium" target="_blank" {href}>{title}</a>
		<div
			class={classNames('w-3 h-3 rounded-full', {
				'bg-green-600': status === 'connected',
				'bg-zinc-600': status === 'disconnected',
				'bg-amber-500': status === 'error'
			})}
		></div>
	</div>
	{@render children?.()}
</div>
