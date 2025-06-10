<script lang="ts">
	import classNames from 'classnames';

	let {
		type = 'text',
		value = $bindable(type === 'text' || 'password' ? '' : 0),
		placeholder = '',
		name = '',
		disabled = false,

		klass = '',

		onchange = (_) => {}
	}: {
		type?: 'text' | 'number' | 'password';
		value?: any;
		placeholder?: string;
		name?: string;
		disabled?: boolean;

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
		/>
	{/if}
</div>
