<script lang="ts">
	import { TriangleRight } from 'svelte-radix';
	import classNames from 'classnames';

	let { onclick, klass = '' }: { onclick: (e: MouseEvent) => void; klass?: string } = $props();
</script>

<div
	class={classNames(
		klass,
		'backdrop-blur-lg rounded-full bg-[#00000044] text-zinc-300 hover:text-zinc-200 p-2'
	)}
	{onclick}
>
	<TriangleRight size="30" />
</div>
