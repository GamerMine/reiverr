<script lang="ts">
	import classNames from 'classnames';
	import { _ } from 'svelte-i18n';
	import { type GlobalSettings } from '$lib/entities/Types';
	import Toggle from "$lib/components/common/inputs/forms/Toggle.svelte";
	import { Plus } from 'svelte-radix';

	let {
		visible,
		globalSettings = $bindable()
	}: {
		visible: boolean;
		globalSettings: GlobalSettings;
	} = $props();

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
</div>

<div class="flex flex-wrap gap-2 my-8">
	<div class="bg-neutral-900 rounded-md h-50 w-80 flex justify-center items-center hover:cursor-pointer hover:bg-neutral-800 transition-colors duration-200">
		<Plus size="40"/>
		<h2>{$_('settings.filtering.addProfile')}</h2>
	</div>
</div>
