<script lang="ts">
	import { fly } from 'svelte/transition';
	import { contextMenu } from './ContextMenu';
	import type { Snippet } from 'svelte';

	let {
		heading = '',
		disabled = false,
		position = 'fixed',

		id = Symbol(),

		children,
		title = undefined,
		menu
	}: {
		heading?: string;
		disabled?: boolean;
		position?: 'absolute' | 'fixed';

		id?: symbol;

		children: Snippet;
		title?: Snippet;
		menu: Snippet;
	} = $props();
	let anchored = position === 'absolute';

	let menu_div: undefined | HTMLDivElement = $state();
	let windowWidth: number = $state(0);
	let windowHeight: number = $state(0);

	let fixedPosition = $state({ x: 0, y: 0 });

	function close() {
		contextMenu.hide();
	}

	export function handleOpen(event: MouseEvent) {
		event.preventDefault();
		if (disabled || (anchored && $contextMenu === id)) {
			close();
			return;
		}

		fixedPosition = { x: event.clientX, y: event.clientY };
		contextMenu.show(id);
		event.preventDefault();
		event.stopPropagation();
	}

	function handleClickOutside(event: MouseEvent) {
		if (!menu_div?.contains(event.target as Node) && $contextMenu === id) {
			event.preventDefault();
			event.stopPropagation();
			close();
		}
	}

	function handleShortcuts(event: KeyboardEvent) {
		if (event.key === 'Escape' && $contextMenu === id) {
			close();
		}
	}
</script>

<svelte:window
	on:keydown={handleShortcuts}
	on:click={handleClickOutside}
	bind:innerWidth={windowWidth}
	bind:innerHeight={windowHeight}
/>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	oncontextmenu={handleOpen}
	onclick={(e) => {
		if (anchored) {
			e.stopPropagation();
			handleOpen(e);
		}
	}}
>
	{@render children?.()}
</div>

{#if $contextMenu === id}
	{#key fixedPosition}
		<div
			class={`${position} z-50 my-2 px-1 py-1 bg-zinc-800/50 rounded-lg backdrop-blur-xl flex flex-col w-max`}
			style={position === 'fixed'
				? `left: ${
						fixedPosition.x - (fixedPosition.x > windowWidth / 2 ? (menu_div?.clientWidth ?? 0) : 0)
					}px; top: ${
						fixedPosition.y -
						(fixedPosition.y > windowHeight / 2 ? (menu_div?.clientHeight ?? 0) : 0)
					}px;`
				: (menu_div?.getBoundingClientRect()?.left ?? 0 > windowWidth / 2)
					? `right: 0;${fixedPosition.y > windowHeight / 2 ? 'bottom: 100%;' : ''}`
					: `left: 0;${fixedPosition.y > windowHeight / 2 ? 'bottom: 100%;' : ''}`}
			bind:this={menu_div}
			in:fly|global={{ y: 5, duration: 100, delay: anchored ? 0 : 100 }}
			out:fly|global={{ y: 5, duration: 100 }}
		>
			{@render title?.()}
			{#if !title}
				{#if heading}
					<h2
						class="text-xs text-zinc-200 opacity-60 tracking-wide font-semibold px-3 py-1 line-clamp-1 text-left"
					>
						{heading}
					</h2>
				{/if}
			{/if}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="flex flex-col gap-0.5" onclick={() => close()}>
				{@render menu?.()}
			</div>
		</div>
	{/key}
{/if}
