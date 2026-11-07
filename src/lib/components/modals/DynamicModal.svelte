<script lang="ts">
	import classNames from 'classnames';
	import { modalStack } from '#lib/stores/modal.store.js';
	import { onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';

	function handleShortcuts(event: KeyboardEvent) {
		if (event.key === 'Escape' && $modalStack.top) {
			modalStack.close($modalStack.top.id);
		}
	}

	onDestroy(() => {
		modalStack.reset();
	});
</script>

<svelte:window on:keydown={handleShortcuts} />

<svelte:head>
	{#if $modalStack.top}
		<style>
			body {
				overflow: hidden;
			}
		</style>
	{/if}
</svelte:head>

{#each $modalStack.stack || [] as modal (modal.id)}
	{@const hidden = $modalStack.top?.group === modal.group && $modalStack.top?.id !== modal.id}

	{#if modal.group === modal.id}
		<div
			class="fixed inset-0 z-20 bg-stone-950/80"
			transition:fade|global={{
				duration: 150
			}}
		></div>
	{/if}

	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div
		class={classNames(
			'reltaive fixed inset-0 z-20 flex items-center justify-center overflow-hidden transition-opacity',
			{
				'opacity-0': hidden
			}
		)}
	>
		<modal.component {...modal.props} modalId={modal.id} />
	</div>
{/each}
