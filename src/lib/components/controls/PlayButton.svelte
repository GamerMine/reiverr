<script lang="ts">
	import { TriangleRight } from 'svelte-radix';
	import classNames from 'classnames';

	let { onclick, klass = '' }: { onclick: (e: MouseEvent) => void; klass?: string } = $props();
</script>

<div
	class={classNames(
		klass,
		'rounded-full bg-[#00000044] p-2 text-zinc-300 backdrop-blur-lg hover:text-zinc-200'
	)}
	{onclick}
>
	<TriangleRight size="30" />
</div>
