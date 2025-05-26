<script lang="ts">
	import classNames from 'classnames';

	let {
		type = 'text',
		value = $bindable(type === 'text' ? '' : 0),
		placeholder = '',

		klass = '',

		onchange = (_) => {}
	}: {
		type?: 'text' | 'number';
		value?: any;
		placeholder?: string;

		klass?: string;

		onchange?: (val: string) => void;
	} = $props();

	function handleChange(event: Event) {
		value = (event.target as HTMLInputElement).value;
		onchange(value);
	}

	const baseStyles =
		'appearance-none p-1 px-3 selectable border border-zinc-800 rounded-lg bg-zinc-600/20 text-zinc-200 placeholder:text-zinc-700';
</script>

<div class="relative">
	{#if type === 'text'}
		<input
			type="text"
			{placeholder}
			bind:value
			oninput={handleChange}
			class={classNames(baseStyles, klass)}
		/>
	{:else if type === 'number'}
		<input
			type="number"
			{placeholder}
			bind:value
			oninput={handleChange}
			class={classNames(baseStyles, 'w-28', klass)}
		/>
	{/if}
</div>
