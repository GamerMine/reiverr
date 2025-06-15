<script lang="ts">
	import classNames from 'classnames';
	import { CaretDown } from 'svelte-radix';
	import type { Snippet } from 'svelte';

	let {
		value = $bindable(''),
		disabled = false,
		loading = false,

		children = undefined,

		onchange = () => {}
	}: {
		value?: any;
		disabled?: boolean;
		loading?: boolean;

		children?: Snippet;

		onchange?: () => void;
	} = $props();
</script>

<div
	class={classNames('relative w-max min-w-[8rem] h-min bg-zinc-600/20 rounded-lg overflow-hidden', {
		'opacity-50': disabled,
		'animate-pulse pointer-events-none': loading
	})}
>
	<select
		{onchange}
		bind:value
		class={classNames(
			'relative appearance-none p-1 pl-3 pr-8 selectable border border-zinc-800 bg-transparent rounded-lg w-full z-[1]',
			{
				'cursor-not-allowed pointer-events-none': disabled
			}
		)}
	>
		{@render children?.()}
	</select>
	<div class="absolute inset-y-0 right-2 flex items-center justify-center">
		<CaretDown size="20" />
	</div>
</div>
