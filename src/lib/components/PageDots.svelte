<script lang="ts">
	import classNames from 'classnames';
	import { DotFilled } from 'svelte-radix';

	let {
		index,
		length,
		onJump
	}: { index: number; length: number; onJump: (index: number) => void } = $props();
	//	export let onPrevious: () => void = () => {};
	//	export let onNext: () => void = () => {};
</script>

<div class="flex gap-1">
	{#each Array.from({ length }) as _, i}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- <div
			on:click={() => onJump(i)}
			class={classNames(
				'py-2 flex-1 w-6 transition-transform hover:scale-y-150 hover:opacity-50 cursor-pointer',
				{
					'opacity-50': i === index,
					'opacity-20': i !== index
				}
			)}
		>
			<div class={classNames('h-[3px] bg-zinc-200 rounded-full', {})} />
		</div> -->
		<div onclick={() => onJump(i)}>
			<DotFilled
				class={classNames(
					'transition-transform hover:scale-150 hover:opacity-50 cursor-pointer text-zinc-200',
					{
						'opacity-50': i === index,
						'opacity-20': i !== index
					}
				)}
				size="20"
			/>
		</div>
	{/each}
</div>
