<script lang="ts">
	import classNames from 'classnames';
	import { CaretDown } from 'svelte-radix';
	import {onMount, setContext, type Snippet} from 'svelte';
	import type {SelectOption} from "$lib/types";
	import {SvelteSet} from "svelte/reactivity";
	import { _ } from 'svelte-i18n';
	import { Cross2 } from "svelte-radix";
    import { portal } from '$lib/utils';

	let {
		value = $bindable(undefined),
		disabled = false,
		loading = false,
		name = undefined,
		multiple = false,
		selectedValues = new SvelteSet<SelectOption>(),

		children = undefined,

		onchange = () => {}
	}: {
		value?: string;
		disabled?: boolean;
		loading?: boolean;
		name?: string;
		multiple?: boolean;
		selectedValues?: SvelteSet<SelectOption>;

		children?: Snippet;

		onchange?: () => void;
	} = $props();

	let options = new SvelteSet<SelectOption>();
	let selectedOptionLabel: string | undefined = $state("");
	let dropdownOpen: boolean = $state(false);
	let dropdownStyle = $state('');
	let triggerElt: HTMLElement;
	let selectElt: HTMLElement;

	setContext('select', {
		register: (opt: SelectOption) => options.add(opt),
		unregister: (opt: SelectOption) => options.delete(opt),
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

	function addValue(option: SelectOption) {
		onchange();
		if (multiple) {
			if (![...selectedValues].some(s => s.value === option.value)) {
				selectedValues.add(option);
			}
		} else {
			dropdownOpen = false;
			selectedOptionLabel = option.label;
			selectedValues.clear();
			selectedValues.add(option);
		}
		value = option.value;
	}

	function removeValue(option: SelectOption) {
		onchange();
		const match = [...selectedValues].find(s => s.value === option.value);
		if (match) selectedValues.delete(match);
		value = option.value;
	}

	$effect(() => {
		if (!multiple) {
			selectedValues = selectedValues;
			if (selectedValues.size === 0) {
				let selectedOption = options.values().next().value;
				selectedOptionLabel = selectedOption?.label;
				if (selectedOption && !multiple) selectedValues.add(selectedOption);
			} else {
				selectedOptionLabel = selectedValues.values().next().value?.label;
			}
		}
	})

	onMount(() => {
		document.addEventListener('click', handleClickOutside);

		window.addEventListener('scroll', handleViewportChange, true);
		window.addEventListener('resize', handleViewportChange);

		return () => {
			document.removeEventListener('click', handleClickOutside);

			window.removeEventListener('scroll', handleViewportChange, true);
			window.removeEventListener('resize', handleViewportChange);
		};
	})
</script>

{@render children?.()}
<div>
	<div class="flex flex-wrap gap-2">
		{#if multiple}
			{#each selectedValues as value}
				<div class="bg-amber-300 px-2 py-1 rounded-2xl flex gap-1">
					<p class="text-xs text-black">{value.label}</p>
					<Cross2 color="black" size="17" class=" rounded-2xl hover:bg-amber-500 p-0.5" onclick={() => removeValue(value)}/>
				</div>
			{/each}
		{/if}
	</div>

	<div bind:this={selectElt}>
		<button
				type="button"
				class={classNames('relative bg-zinc-800 rounded-lg py-1.5 cursor-pointer text-nowrap', {
			'opacity-50': disabled,
			'animate-pulse pointer-events-none': loading
		})}
				onclick={() => {
					dropdownOpen = !dropdownOpen;
					if (dropdownOpen) updateDropdownPosition();
				}}
				bind:this={triggerElt}
		>
			{#if multiple}
				<h2 class="pl-2 pr-8">{$_("general.select")}</h2>
			{:else}
				<h2 class="pl-2 pr-8">{selectedOptionLabel}</h2>
			{/if}
			<div class="absolute inset-y-0 right-2 flex items-center justify-center">
				<CaretDown size="20" />
			</div>
		</button>
	</div>
</div>

<div
		use:portal
		style={dropdownStyle}
		class={classNames("text-center bg-zinc-800 z-100 rounded-md overflow-y-auto max-h-80", {
		'hidden': !dropdownOpen
	})}>
	{#each options as option}
		{#if !multiple || ![...selectedValues].some(s => s.value === option.value)}
			<button
					type="button"
					class="py-1 px-2 hover:bg-zinc-700 cursor-default w-full"
					onclick={() => addValue(option)}
			>
				{option.label}
			</button>
		{/if}
	{/each}
</div>

{#each selectedValues as value}
	<input type="hidden" name={name} value={value.value}>
{/each}