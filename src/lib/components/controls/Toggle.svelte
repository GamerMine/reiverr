<script lang="ts">
	import type { ClassValue } from 'svelte/elements';

	let {
		checked = $bindable(false),
		name = undefined,
		class: className = '',

		onchange = () => {}
	}: {
		checked?: boolean;
		name?: string;
		class?: ClassValue;

		onchange?: (checked: boolean) => void;
	} = $props();
</script>

<div class={className}>
	<label class="relative inline-flex items-center cursor-pointer w-min h-min">
		<input
			type="checkbox"
			bind:checked
			class="sr-only peer"
			{name}
			onchange={(v) => onchange(v.currentTarget.checked)}
		/>
		<div
			class="w-11 h-6 rounded-full peer bg-zinc-800 peer-checked:bg-amber-300 peer-selectable
		after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5
		after:transition-all peer-checked:after:translate-x-full peer-checked:after:bg-zinc-800 peer-checked:after:border-zinc-800
		after:content-[''] after:absolute after:top-[2px] after:left-[2px]"
		></div>
	</label>
</div>
