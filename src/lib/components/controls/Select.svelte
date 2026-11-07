<script lang="ts">
	import classNames from 'classnames';
	import { CaretDown, Cross2 } from 'svelte-radix';
	import { onMount, setContext, type Snippet } from 'svelte';
	import type { SelectOption } from '#lib/utils/types.js';
	import { SvelteSet } from 'svelte/reactivity';
	import { _ } from 'svelte-i18n';
	import { portal } from '#lib/utils/utils.js';

	let {
		value = $bindable(undefined),
		disabled = false,
		loading = false,
		name = undefined,
		multiple = false,
		selectedValues = $bindable(),
		placeholder = $_('general.select'),
		showOnlyPlaceholder = false,
		variant = 'secondary',

		children = undefined,

		onchange = () => {}
	}: {
		value?: string;
		disabled?: boolean;
		loading?: boolean;
		name?: string;
		multiple?: boolean;
		selectedValues?: string[] | string;
		placeholder?: string;
		showOnlyPlaceholder?: boolean;
		variant?: 'primary' | 'secondary';

		children?: Snippet;

		onchange?: (newVal: string) => void;
	} = $props();

	let options = new SvelteSet<SelectOption>();
	let selectedOptionLabel: string | undefined = $state('');
	let dropdownOpen: boolean = $state(false);
	let dropdownStyle = $state('');
	let triggerElt: HTMLElement;
	let selectElt: HTMLElement;

	setContext('select', {
		register: (opt: SelectOption) => options.add(opt),
		unregister: (opt: SelectOption) => options.delete(opt)
	});

	function updateDropdownPosition() {
		if (!triggerElt) return;

		const rect = triggerElt.getBoundingClientRect();

		dropdownStyle = `
		position: fixed;
		top: ${rect.bottom + 4}px;
		left: ${rect.left}px;
		width: ${rect.width}px;
		z-index: 1000;
	`;
	}

	function handleClickOutside(e: MouseEvent) {
		if (selectElt && !selectElt.contains(e.target as Node)) dropdownOpen = false;
	}

	function handleViewportChange() {
		if (dropdownOpen) {
			updateDropdownPosition();
		}
	}

	function getLabel(value: string | undefined) {
		if (value === undefined) return null;
		for (const option of options) {
			if (option.value === value) {
				return option.label;
			}
		}
		return null;
	}

	function addValue(option: SelectOption) {
		onchange(option.value);
		if (multiple && typeof selectedValues === 'object') {
			if (!selectedValues.includes(option.value)) {
				selectedValues = selectedValues.concat(option.value);
			}
		} else {
			dropdownOpen = false;
			selectedOptionLabel = option.label;
			selectedValues = option.value;
		}
		value = option.value;
	}

	function removeValue(val: string) {
		if (typeof selectedValues === 'object') {
			onchange(val);
			selectedValues = selectedValues.filter((e) => e !== val);
			value = val;
		}
	}

	$effect(() => {
		if (selectedValues === undefined || selectedValues === null) {
			if (multiple) selectedValues = [];
			else selectedValues = '';
		}
		if (!multiple && typeof selectedValues === 'string') {
			if (selectedValues.length === 0) {
				let selectedOption = options.values().next().value;
				selectedOptionLabel = selectedOption?.label;
				if (selectedOption) selectedValues = selectedOption.value;
			} else {
				selectedOptionLabel = selectedValues;
			}
		}
	});

	onMount(() => {
		document.addEventListener('click', handleClickOutside);

		window.addEventListener('scroll', handleViewportChange, true);
		window.addEventListener('resize', handleViewportChange);

		return () => {
			document.removeEventListener('click', handleClickOutside);

			window.removeEventListener('scroll', handleViewportChange, true);
			window.removeEventListener('resize', handleViewportChange);
		};
	});
</script>

{@render children?.()}
<div>
	<div class="flex max-h-24 flex-wrap gap-2 overflow-y-auto">
		{#if multiple && typeof selectedValues === 'object'}
			{#each selectedValues as value (value)}
				<div class="flex gap-1 rounded-2xl bg-amber-300 px-2 py-1">
					<p class="text-xs text-black">{getLabel(value)}</p>
					<Cross2
						color="black"
						size="17"
						class=" rounded-2xl p-0.5 hover:bg-amber-500"
						onclick={() => removeValue(value)}
					/>
				</div>
			{/each}
		{/if}
	</div>

	<div bind:this={selectElt}>
		<button
			bind:this={triggerElt}
			class={classNames('relative cursor-pointer rounded-lg py-1.5 text-nowrap', {
				'bg-zinc-800': variant === 'secondary',
				'bg-white text-black': variant === 'primary',
				'cursor-default opacity-50': disabled,
				'pointer-events-none animate-pulse': loading
			})}
			onclick={() => {
				if (!disabled || !loading) {
					dropdownOpen = !dropdownOpen;
					if (dropdownOpen) updateDropdownPosition();
				}
			}}
			type="button"
		>
			{#if multiple || showOnlyPlaceholder}
				<h2 class="pr-8 pl-2">{placeholder}</h2>
			{:else}
				<h2 class="pr-8 pl-2">{getLabel(selectedOptionLabel)}</h2>
			{/if}
			<div class="absolute inset-y-0 right-2 flex items-center justify-center">
				<CaretDown size="20" />
			</div>
		</button>
	</div>
</div>

<div
	class={classNames('z-100 max-h-80 overflow-y-auto rounded-md bg-zinc-800 text-center', {
		hidden: !dropdownOpen
	})}
	style={dropdownStyle}
	use:portal
>
	{#each options as option (option)}
		{#if !multiple || !(typeof selectedValues === 'object' && selectedValues.includes(option.value))}
			<button
				type="button"
				class="w-full cursor-default px-2 py-1 hover:bg-zinc-700"
				onclick={() => addValue(option)}
			>
				{option.label}
			</button>
		{/if}
	{/each}
</div>

{#if typeof selectedValues === 'object'}
	{#each selectedValues as val (val)}
		<input type="hidden" {name} value={val} />
	{/each}
{:else}
	<input type="hidden" {name} value={selectedValues} />
{/if}
