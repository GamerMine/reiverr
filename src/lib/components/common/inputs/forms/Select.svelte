<script lang="ts">
	import classNames from 'classnames';
	import { CaretDown } from 'svelte-radix';
	import {onMount, setContext, type Snippet} from 'svelte';
	import type {SelectOption} from "$lib/types";
	import {SvelteSet} from "svelte/reactivity";

	let {
		value = $bindable(undefined),
		disabled = false,
		loading = false,
		name = undefined,
		multiple = false,

		children = undefined,

		onchange = () => {}
	}: {
		value?: string | undefined;
		disabled?: boolean;
		loading?: boolean;
		name?: string;
		multiple?: boolean;

		children?: Snippet;

		onchange?: () => void;
	} = $props();

	let options = new SvelteSet<SelectOption>();
	let selectedOptionLabel: string | undefined = $state("");
	let dropdownOpen: boolean = $state(false);
	let selectElt: HTMLElement;
	let selectedValues = $state(new SvelteSet<SelectOption>());

	setContext('select', {
		register: (opt: SelectOption) => options.add(opt),
		unregister: (opt: SelectOption) => options.delete(opt),
	});

	document.addEventListener('click', e => {
		if (selectElt && !selectElt.contains(e.target as Node)) dropdownOpen = false;
	})

	function selectValue(option: SelectOption) {
		onchange();
		value = option.value;
		if (multiple) {
			if (selectedValues.has(option)) selectedValues.delete(option);
			selectedValues.add(option);
		} else {
			dropdownOpen = false;
			selectedOptionLabel = option.label;
			selectedValues.clear();
			selectedValues.add(option);
		}
	}

	onMount(() => {
		let selectedOption = options.values().next().value;
		selectedOptionLabel = selectedOption?.label;
		if (selectedOption && !multiple) selectedValues.add(selectedOption);
	})
</script>

{@render children?.()}
<div bind:this={selectElt}>
	<div
			class={classNames('relative w-max min-w-32 h-min bg-zinc-800 rounded-lg py-1.5 cursor-pointer', {
		'opacity-50': disabled,
		'animate-pulse pointer-events-none': loading
	})}
			onclick={() => dropdownOpen = !dropdownOpen}
	>
		<h2 class="ml-2">{selectedOptionLabel}</h2>
		<div class="absolute inset-y-0 right-2 flex items-center justify-center">
			<CaretDown size="20" />
		</div>
	</div>
	<div class={classNames("text-center absolute scroll-auto bg-zinc-800 z-100 rounded-md overflow-scroll max-h-80", {
		'hidden': !dropdownOpen
	})}>
		{#each options as option}
			<h2
				class="py-1 px-2 hover:bg-zinc-700 cursor-default"
				onclick={() => selectValue(option)}
			>
				{option.label}
			</h2>
		{/each}
	</div>
</div>
{#each selectedValues as value}
	<input type="hidden" name={name} value={value.value}>
{/each}