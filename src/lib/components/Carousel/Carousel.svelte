<script lang="ts">
	import { fade } from 'svelte/transition';
	import IconButton from '../IconButton.svelte';
	import { ChevronLeft, ChevronRight } from 'radix-icons-svelte';
	import classNames from 'classnames';
	import { type Snippet, tick } from 'svelte';

	let {
		gradientFromColor = 'from-stone-950',
		scrollClass = '',
		heading = '',
		klass = '',

		children,
		title = undefined
	}: {
		gradientFromColor?: string;
		scrollClass?: string;
		heading?: string;
		klass?: string;

		children: Snippet;
		title?: Snippet;
	} = $props();

	let carousel: HTMLDivElement | undefined = $state();
	let carousel_scroll_width = $state(false);

	let scrollX = $state(0);

	$effect.pre(() => {
		tick();
		if (carousel) {
			const observer = new ResizeObserver((entries) => {
				for (const entry of entries) {
					carousel_scroll_width = entry.target.scrollWidth <= entry.target.clientWidth;
				}
			});

			observer.observe(carousel);
		}
	});
</script>

<div class={classNames('flex flex-col gap-4 group/carousel', klass)}>
	<div class={'flex justify-between items-center gap-4 ' + scrollClass}>
		{@render title?.()}
		{#if !title}
			<div class="font-semibold text-xl">{heading}</div>
		{/if}
		<div
			class={classNames(
				'flex gap-2 sm:opacity-0 transition-opacity sm:group-hover/carousel:opacity-100',
				{
					hidden: carousel_scroll_width
				}
			)}
		>
			<IconButton
				onclick={() => {
					carousel?.scrollTo({ left: scrollX - carousel?.clientWidth * 0.8, behavior: 'smooth' });
				}}
			>
				<ChevronLeft size={20} />
			</IconButton>
			<IconButton
				onclick={() => {
					carousel?.scrollTo({ left: scrollX + carousel?.clientWidth * 0.8, behavior: 'smooth' });
				}}
			>
				<ChevronRight size={20} />
			</IconButton>
		</div>
	</div>

	<div class="relative">
		<div
			class={classNames(
				'flex overflow-x-scroll items-center overflow-y-visible scrollbar-hide gap-4 relative p-1',
				scrollClass
			)}
			bind:this={carousel}
			tabindex="-1"
			onscroll={() => {
				scrollX = carousel?.scrollLeft || scrollX;
			}}
		>
			{@render children?.()}
		</div>
		{#if scrollX > 50}
			<div
				transition:fade={{ duration: 200 }}
				class={'absolute inset-y-0 left-0 w-0 sm:w-16 md:w-24 bg-gradient-to-r ' +
					gradientFromColor}
			></div>
		{/if}
		{#if carousel && scrollX < carousel?.scrollWidth - carousel?.clientWidth - 50}
			<div
				transition:fade={{ duration: 200 }}
				class={'absolute inset-y-0 right-0 w-0 sm:w-16 md:w-24 bg-gradient-to-l ' +
					gradientFromColor}
			></div>
		{/if}
	</div>
</div>
