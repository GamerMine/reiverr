<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	let { hasMore = true, onloadMore }: { hasMore?: boolean; onloadMore: () => void } = $props();

	let observer: IntersectionObserver;
	let loadMoreElement: HTMLElement;

	const loadMore = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting && hasMore) {
				onloadMore();
			}
		});
	};

	onMount(() => {
		observer = new IntersectionObserver(loadMore, { threshold: 1.0 });
		observer.observe(loadMoreElement);
	});

	onDestroy(() => {
		if (observer) {
			observer.disconnect();
		}
	});
</script>

<div bind:this={loadMoreElement} id="svelte-infinite-scroll" style="width: 0;"></div>
