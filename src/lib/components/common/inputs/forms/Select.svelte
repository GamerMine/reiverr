<script lang="ts">
	import classNames from 'classnames';
	import { CaretDown } from 'svelte-radix';
	import {onMount, setContext, type Snippet} from 'svelte';
	import type {SelectOption} from "$lib/types";
	import {SvelteSet} from "svelte/reactivity";
	import { _ } from 'svelte-i18n';
	import { Cross2 } from "svelte-radix";

	let {
		value = $bindable([]),
		disabled = false,
		loading = false,
		name = undefined,
		multiple = false,

		children = undefined,

		onchange = () => {}
	}: {
		value?: SelectOption[];
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

	function addValue(option: SelectOption) {
		onchange();
		if (multiple) {
			selectedValues.add(option);
			dropdownOpen = true;
		} else {
			dropdownOpen = false;
			selectedOptionLabel = option.label;
			selectedValues.clear();
			selectedValues.add(option);
		}
		value = [...selectedValues];
	}

	function removeValue(option: SelectOption) {
		onchange();
		selectedValues.delete(option);
		value = [...selectedValues];
	}

	onMount(() => {
		console.log(value);
		if (value && value.length > 0) {
			for (const val of value) {
				selectedValues.add(val);
			}
		} else {
			let selectedOption = options.values().next().value;
			selectedOptionLabel = selectedOption?.label;
			if (selectedOption && !multiple) selectedValues.add(selectedOption);
		}
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
		<div
				class={classNames('relative w-max min-w-32 h-min bg-zinc-800 rounded-lg py-1.5 cursor-pointer', {
			'opacity-50': disabled,
			'animate-pulse pointer-events-none': loading
		})}
				onclick={() => dropdownOpen = !dropdownOpen}
		>
			{#if multiple}
				<h2 class="ml-2">{$_("general.select")}</h2>
			{:else}
				<h2 class="ml-2">{selectedOptionLabel}</h2>
			{/if}
			<div class="absolute inset-y-0 right-2 flex items-center justify-center">
				<CaretDown size="20" />
			</div>
		</div>
		<div class={classNames("text-center absolute scroll-auto bg-zinc-800 z-100 rounded-md overflow-scroll max-h-80", {
			'hidden': !dropdownOpen
		})}>
			{#each options as option}
				{#if !multiple || !selectedValues.has(option)}
					<h2
						class="py-1 px-2 hover:bg-zinc-700 cursor-default"
						onclick={() => addValue(option)}
					>
						{option.label}
					</h2>
				{/if}
			{/each}
		</div>
	</div>
</div>
{#each selectedValues as value}
	<input type="hidden" name={name} value={value.value}>
{/each}