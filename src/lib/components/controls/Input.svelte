<script lang="ts">
	import classNames from 'classnames';

	let {
		type = 'text',
		value = $bindable(undefined),
		placeholder = '',
		name = '',
		disabled = false,
		required = false,

		klass = '',

		onchange = () => {}
	}: {
		type?: 'text' | 'number' | 'password';
		value?: string | number;
		placeholder?: string;
		name?: string;
		disabled?: boolean;
		required?: boolean;

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
			{name}
			{placeholder}
			{disabled}
			bind:value
			oninput={handleChange}
			class={classNames(klass, baseStyles)}
			{required}
		/>
	{:else if type === 'password'}
		<input
			type="password"
			{name}
			{placeholder}
			{disabled}
			bind:value
			oninput={handleChange}
			class={classNames(klass, baseStyles)}
			{required}
		/>
	{:else if type === 'number'}
		<input
			type="number"
			{name}
			{placeholder}
			{disabled}
			bind:value
			oninput={handleChange}
			class={classNames(klass, baseStyles, 'w-28')}
			{required}
		/>
	{/if}
</div>
