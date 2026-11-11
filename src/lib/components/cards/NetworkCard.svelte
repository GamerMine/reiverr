<script lang="ts">
	import type { Network } from '#lib/utils/discover.js';

	let { network }: { network: Network } = $props();
</script>

<a
	href={`/discover/network/${network.name}`}
	class="group selectable relative block h-52 w-96 max-w-[100%] shrink-0 cursor-pointer rounded-xl border border-stone-700 bg-zinc-900 p-12 text-zinc-300 transition-all hover:text-purple-300"
	aria-label="network"
>
	<div
		class="absolute inset-10 bg-zinc-300 transition-all sm:group-hover:scale-105
		sm:hover:bg-purple-300"
		style={"mask-image: url('/networks/" +
			network.name +
			".svg'); mask-size: contain; mask-repeat: no-repeat; mask-position: center;"}
	></div>
</a>
