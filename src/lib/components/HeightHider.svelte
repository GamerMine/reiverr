<script lang="ts">
	import classNames from 'classnames';
	import type { Snippet } from 'svelte';

	let {
		visible = false,
		duration = 300,
		children
	}: { visible?: boolean; duration?: number; children: Snippet } = $props();
</script>

<div
	class={classNames('transition-[max-height] duration-1000 overflow-hidden', {
		'max-h-0': !visible,
		'max-h-max': visible
	})}
	style="transition-duration: {duration}ms;"
>
	{@render children?.()}
</div>
