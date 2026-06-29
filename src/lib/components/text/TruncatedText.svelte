<script lang="ts">
	import type { ClassValue } from 'svelte/elements';

	let {
		text,
		maxLength = 300,
		class: className = ''
	}: { text: string; maxLength?: number; class?: ClassValue } = $props();

	import { _ } from 'svelte-i18n';

	let viewAll = $state(false);
</script>

<p class={className}>
	{#if text.length > maxLength}
		{#if viewAll}
			{text}
		{:else}
			{text.slice(0, maxLength).trim()}...
		{/if}
		<button
			class="underline hover:text-zinc-100 text-zinc-400"
			onclick={() => (viewAll = !viewAll)}
		>
			{viewAll ? $_('library.content.viewLess') : $_('library.content.viewAll')}
		</button>
	{:else}
		{text}
	{/if}
</p>
