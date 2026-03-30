<script lang="ts">
    import classNames from 'classnames';
    import {onDestroy} from 'svelte';
    import {fade} from 'svelte/transition';
    import modalStore from "$lib/stores/modal.store";

    function handleShortcuts(event: KeyboardEvent) {
        if (event.key === 'Escape' && $modalStack.top) {
            modalStack.close($modalStack.top.id);
        }
    }

    onDestroy(() => {
        modalStack.reset();
    });
</script>

<svelte:window on:keydown={handleShortcuts}/>

<svelte:head>
    {#if modalStore.top}
        <style>
            body {
                overflow: hidden;
            }
        </style>
    {/if}
</svelte:head>

{#each modalStore.stack || [] as modal (modal.id)}
    {@const hidden = modalStore.top?.group === modal.group && modalStore.top?.id !== modal.id}

    {#if modal.group === modal.id}
        <div
                class="fixed inset-0 bg-stone-950/80 z-20"
                transition:fade|global={{
				duration: 150
			}}
        ></div>
    {/if}

    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
            class={classNames(
			'fixed inset-0 justify-center items-center z-20 overflow-hidden flex transition-opacity reltaive',
			{
				'opacity-0': hidden
			}
		)}
    >
        <modal.component {...modal.props} modalId={modal.id}/>
    </div>
{/each}
