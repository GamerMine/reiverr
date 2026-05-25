<script lang="ts">
	let { checked = $bindable(false), name = undefined }: { checked?: boolean; name?: string } =
		$props();
</script>

<label class="relative inline-flex items-center cursor-pointer w-min h-min">
	<input type="checkbox" bind:checked class="sr-only peer" {name} />
	<div
		class="w-11 h-6 rounded-full peer bg-zinc-800 peer-checked:bg-zinc-600 peer-selectable
		after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5
		after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white
		after:content-[''] after:absolute after:top-[2px] after:left-[2px]"
	></div>
</label>
