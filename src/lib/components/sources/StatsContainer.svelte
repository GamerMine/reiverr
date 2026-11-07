<script lang="ts">
	import classNames from 'classnames';
	import type { Snippet } from 'svelte';

	type Stat = {
		title: string;
		value: string;
	};

	let {
		title,
		subtitle,
		stats = [],
		href = '#',
		fillPercentage = 0,

		color = '#fde68a20',
		large = false,

		icon
	}: {
		title: string;
		subtitle: string;
		stats?: Stat[];
		href?: string;
		fillPercentage?: number;

		color?: string;
		large?: boolean;

		icon: Snippet;
	} = $props();
</script>

<div
	class={classNames('relative mx-auto w-full overflow-hidden rounded-xl px-6', {
		'h-16': !large,
		'h-28': large
	})}
	style={'background-color: ' + color + ';'}
>
	<div
		class="absolute inset-y-0 left-0 bg-[#ffffff22]"
		style={'width: ' + fillPercentage + '%;'}
	></div>
	{#if large}
		{@render icon?.()}
	{/if}
	<div
		class={classNames('relative z-[1] flex h-full flex-1', {
			'items-center justify-between': !large,
			'flex-col justify-center gap-2': large
		})}
	>
		<div class="flex flex-col">
			<h3 class="text-xs font-medium tracking-wider text-zinc-400">{subtitle}</h3>
			<a target="_blank" {href} class="text-xl font-bold tracking-wide text-zinc-200"
				>{title}</a
			>
		</div>
		<div class="flex gap-8">
			{#each stats as { title, value }}
				<div class="flex flex-col items-center gap-0.5">
					<h3 class="text-xs font-medium tracking-wider text-zinc-400 uppercase">
						{title}
					</h3>
					<div class="text-sm font-medium">{value}</div>
				</div>
			{/each}
		</div>
	</div>
</div>
