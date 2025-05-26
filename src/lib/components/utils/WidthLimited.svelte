<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children, klass = '' }: { children: Snippet; klass?: string } = $props();
</script>

<div class={klass + ' mx-auto max-w-screen-2xl'}>
	{@render children?.()}
</div>

<!-- FIXME: Might be unused -->
