<script lang="ts">
	import { TriangleRight } from 'radix-icons-svelte';
	import classNames from 'classnames';

	let { onclick, klass = '' }: { onclick: (e: MouseEvent) => void; klass?: string } = $props();
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class={classNames(
		klass,
		'backdrop-blur-lg rounded-full bg-[#00000044] text-zinc-300 hover:text-zinc-200 p-2'
	)}
	{onclick}
>
	<TriangleRight size={30} />
</div>
