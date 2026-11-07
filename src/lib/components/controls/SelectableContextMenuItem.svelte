<script lang="ts">
	import classNames from 'classnames';
	import { Check } from 'svelte-radix';
	import ContextMenuItem from './ContextMenuItem.svelte';
	import type { Snippet } from 'svelte';

	let {
		selected = false,
		children,
		onclick
	}: { selected?: boolean; children: Snippet; onclick: (e: MouseEvent) => void } = $props();
</script>

<ContextMenuItem {onclick}>
	<div class="flex cursor-pointer items-center justify-between gap-2">
		<Check
			size="20"
			class={classNames({
				'opacity-0': !selected,
				'opacity-100': selected
			})}
		/>
		<div class="flex w-32 items-center text-left">
			{@render children?.()}
		</div>
	</div>
</ContextMenuItem>
