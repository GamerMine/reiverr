<script lang="ts">
	import classNames from 'classnames';
	import { Check } from 'radix-icons-svelte';
	import ContextMenuItem from './ContextMenuItem.svelte';
	import type { Snippet } from 'svelte';

	let {
		selected = false,
		children,
		onclick
	}: { selected?: boolean; children: Snippet; onclick: (e: MouseEvent) => void } = $props();
</script>

<ContextMenuItem {onclick}>
	<div class="flex items-center gap-2 justify-between cursor-pointer">
		<Check
			size={20}
			class={classNames({
				'opacity-0': !selected,
				'opacity-100': selected
			})}
		/>
		<div class="flex items-center text-left w-32">
			{@render children?.()}
		</div>
	</div>
</ContextMenuItem>
