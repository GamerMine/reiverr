<script lang="ts">
	import type { Network } from '$lib/discover';

	let { network }: { network: Network } = $props();
</script>

<a
	href={`/discover/network/${network.name}`}
	class="block border rounded-xl h-52 w-96 bg-zinc-900 border-stone-700 cursor-pointer p-12 text-zinc-300 hover:text-amber-200 transition-all relative group selectable shrink-0 max-w-[100%]"
	aria-label="network"
>
	<div
		class="absolute inset-10 bg-zinc-300 sm:hover:bg-amber-200 sm:group-hover:scale-105
		transition-all"
		style={"mask-image: url('/networks/" +
			network.name +
			".svg'); mask-size: contain; mask-repeat: no-repeat; mask-position: center;"}
	></div>
</a>
