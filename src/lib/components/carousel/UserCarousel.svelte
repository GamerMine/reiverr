<script lang="ts">
	import IconButton from '$lib/components/controls/IconButton.svelte';
	import { ChevronLeft, ChevronRight } from 'svelte-radix';
	import classNames from 'classnames';
	import { type Snippet, tick } from 'svelte';

	let {
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
					carousel?.scrollTo({
						left: scrollX - carousel?.clientWidth * 0.8,
						behavior: 'smooth'
					});
				}}
			>
				<ChevronLeft size="20" />
			</IconButton>
			<IconButton
				onclick={() => {
					carousel?.scrollTo({
						left: scrollX + carousel?.clientWidth * 0.8,
						behavior: 'smooth'
					});
				}}
			>
				<ChevronRight size="20" />
			</IconButton>
		</div>
	</div>

	<div class="relative">
		<div
			class={classNames(
				'flex overflow-x-scroll items-center overflow-y-visible scrollbar-hide gap-4 relative p-1 justify-center',
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
	</div>
</div>
