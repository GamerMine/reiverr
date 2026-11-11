<script lang="ts">
	import type { ClassValue } from 'svelte/elements';
	import { _ } from 'svelte-i18n';

	let {
		text,
		maxLines = 3,
		class: className = ''
	}: {
		text: string;
		maxLines?: number;
		class?: ClassValue;
	} = $props();

	let viewAll = $state(false);
	let textEl: HTMLParagraphElement | undefined = $state();
	let overflowing = $state(false);

	$effect(() => {
		text;
		maxLines;
		if (textEl && !viewAll) overflowing = textEl.scrollHeight > textEl.clientHeight + 1;
	});

	const mask = 'linear-gradient(to bottom, black 40%, transparent 100%)';
</script>

<button
	type="button"
	class={['block w-full text-left', overflowing ? 'cursor-pointer' : 'cursor-default', className]}
	onclick={() => {
		if (overflowing || viewAll) viewAll = !viewAll;
	}}
	aria-expanded={viewAll}
	title={overflowing || viewAll
		? viewAll
			? $_('library.content.viewLess')
			: $_('library.content.viewAll')
		: undefined}
>
	<p
		bind:this={textEl}
		class="overflow-hidden"
		style={viewAll
			? undefined
			: `display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: ${maxLines}; line-clamp: ${maxLines};` +
				(overflowing ? ` mask-image: ${mask}; -webkit-mask-image: ${mask};` : '')}
	>
		{text}
	</p>
</button>
