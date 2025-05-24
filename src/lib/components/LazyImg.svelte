<script lang="ts">
	import classNames from 'classnames';
	import type { Snippet } from 'svelte';

	let {
		src,
		alt = '',
		klass = '',

		children = undefined
	}: { src: string; alt?: string; klass?: string; children?: Snippet } = $props();

	let loaded = $state(false);

	function handleLoad() {
		loaded = true;
	}
</script>

<div
	class={classNames(
		'transition-opacity duration-300',
		{
			'opacity-0': !loaded,
			'opacity-100': loaded
		},
		klass
	)}
>
	<img
		{src}
		{alt}
		style="object-fit: cover; width: 100%; height: 100%;"
		loading="lazy"
		onload={handleLoad}
	/>
	{@render children?.()}
</div>
