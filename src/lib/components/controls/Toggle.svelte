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
	<label class="relative inline-flex h-min w-min cursor-pointer items-center">
		<input
			type="checkbox"
			bind:checked
			class="peer sr-only"
			{name}
			onchange={(v) => onchange(v.currentTarget.checked)}
		/>
		<div
			class="peer peer-selectable h-6 w-11 rounded-full bg-zinc-800 peer-checked:bg-amber-300
		after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full
		after:border after:border-gray-300 after:bg-white after:transition-all
		after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-zinc-800 peer-checked:after:bg-zinc-800"
		></div>
	</label>
</div>
