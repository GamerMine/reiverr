<script lang="ts">
	import classNames from 'classnames';
	import { onMount, type Snippet } from 'svelte';

	let { children, klass = '' }: { children: Snippet; klass?: string } = $props();

	let element: HTMLDivElement;
	let scrollX = 0;
	let maxScrollX = 0;
	let fadeLeft = $state(false);
	let fadeRight = $state(true);

	$effect(() => {
		fadeLeft = scrollX > 10;
		fadeRight = scrollX < maxScrollX - 10;
	});

	function updateScrollPosition() {
		scrollX = element.scrollLeft;
		maxScrollX = element.scrollWidth - element.clientWidth;
	}

	onMount(() => {
		updateScrollPosition();
	});
</script>

<div
	class={classNames(klass, 'overflow-x-scroll scrollbar-hide relative p-1')}
	style={`mask-image: linear-gradient(to right, transparent 0%, ${
		fadeLeft ? '' : 'black 0%, '
	}black 5%, black 95%, ${fadeRight ? '' : 'black 100%, '}transparent 100%);`}
	onscroll={updateScrollPosition}
	bind:this={element}
>
	{@render children?.()}
</div>
