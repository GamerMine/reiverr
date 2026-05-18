<script lang="ts">
	import classNames from 'classnames';
	import { _ } from 'svelte-i18n';
	import { type GlobalSettings } from '$lib/entities/Types';
	import Toggle from "$lib/components/common/inputs/forms/Toggle.svelte";
	import { Plus } from 'svelte-radix';
	import {modalStack} from "$lib/stores/modal.store";
	import FilteringProfileModal from "$lib/components/modals/FilteringProfileModal.svelte";

	let {
		visible,
		globalSettings = $bindable()
	}: {
		visible: boolean;
		globalSettings: GlobalSettings;
	} = $props();

	function addProfile(e: MouseEvent) {
		e.preventDefault();
		modalStack.create(FilteringProfileModal, {});
	}
</script>

<div
	class={classNames({
		hidden: !visible,
		'grid grid-cols-2 gap-4': visible
	})}
>
	<div
		class="border-b border-zinc-800 pb-4 mt-8 col-span-2 justify-self-stretch flex flex-col gap-2"
	>
		<h1 class="font-medium text-2xl text-zinc-200 tracking-wide">
			{$_('settings.filtering.filteringProfiles')}
		</h1>
	</div>
	<div>
		<h2>
			{$_('settings.filtering.letUserChoose')}
		</h2>
		<p class="text-sm text-zinc-500 mt-1">
			{$_('settings.filtering.letUserChooseDescription')}
		</p>
	</div>
	<Toggle name="userAutoplayTrailers" />

	<div class="flex flex-wrap gap-2 my-8 col-span-2">
		<button
				class="bg-neutral-900 rounded-md h-50 w-80 flex justify-center items-center hover:cursor-pointer hover:bg-neutral-800 transition-colors duration-200"
				onclick={addProfile}
		>
			<Plus size="40"/>
			<h2>{$_('settings.filtering.addProfile')}</h2>
		</button>
	</div>
</div>
