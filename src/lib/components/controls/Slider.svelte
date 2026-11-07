<script lang="ts">
	let {
		min = 0,
		max = 100,
		step = 0.01,
		primaryValue = $bindable(0),
		secondaryValue = 0,

		onmouseup = () => {},
		onmousedown = () => {},
		ontouchstart = () => {},
		ontouchend = () => {}
	}: {
		min?: number;
		max?: number;
		step?: number;
		primaryValue?: number;
		secondaryValue?: number;

		onmouseup?: () => void;
		onmousedown?: () => void;
		ontouchstart?: () => void;
		ontouchend?: () => void;
	} = $props();

	let progressBarOffset = $state(0);
</script>

<div class="group relative h-1">
	<div class="relative h-full px-[0.5rem]">
		<div class="relative h-full overflow-hidden rounded-full bg-zinc-200/20">
			<!-- Secondary progress -->
			<div
				class="absolute top-0 h-full bg-zinc-200/20"
				style="width: {(secondaryValue / max) * 100}%;"
			></div>

			<!-- Primary progress -->
			<div
				class="absolute top-0 h-full bg-amber-300"
				style="width: {(primaryValue / max) * 100}%;"
				bind:offsetWidth={progressBarOffset}
			></div>
		</div>

		<div
			class="absolute top-1/2 mx-2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 transform
			cursor-pointer rounded-full bg-amber-200 opacity-0 drop-shadow-md transition-opacity
			duration-100 group-hover:opacity-100"
			style="left: {progressBarOffset}px;"
		></div>
	</div>

	<input
		type="range"
		class="absolute -top-0.5 h-2 w-full cursor-pointer opacity-0"
		{min}
		{max}
		{step}
		bind:value={primaryValue}
		{onmouseup}
		{onmousedown}
		{ontouchstart}
		{ontouchend}
	/>
</div>
