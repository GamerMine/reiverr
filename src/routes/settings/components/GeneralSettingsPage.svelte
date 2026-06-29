<script lang="ts">
	import Input from '$lib/components/controls/Input.svelte';
	import Select from '$lib/components/controls/Select.svelte';
	import Toggle from '$lib/components/controls/Toggle.svelte';
	import { ISO_LANGUAGES } from '$lib/utils/iso-languages';
	import { ISO_REGIONS } from '$lib/utils/iso-regions';
	import { _, dictionary } from 'svelte-i18n';
	import classNames from 'classnames';
	import type { UserSettings } from '@reiverr/db';
	import Option from '$lib/components/controls/Option.svelte';
	import { saveSettings } from '$lib/remote/settings.remote';

	let { visible, userSettings = $bindable() }: { visible: boolean; userSettings: UserSettings } =
		$props();
</script>

<div
	class={classNames({
		hidden: !visible,
		'grid grid-cols-[1fr_min-content] justify-items-start place-items-center gap-4 text-zinc-400':
			visible
	})}
>
	<h1
		class="font-medium text-xl text-zinc-200 tracking-wide col-span-2 border-b border-zinc-800 justify-self-stretch pb-2 mt-8"
	>
		{$_('settings.general.userInterface.userInterface')}
	</h1>
	<h2>{$_('settings.general.userInterface.language')}</h2>
	<Select
		bind:value={userSettings.interface.language}
		name={saveSettings.fields.userLanguage.as('select').name}
		selectedValues={userSettings.interface.language}
	>
		{#each Object.entries(ISO_LANGUAGES).filter( ([c]) => Object.keys($dictionary).includes(c) ) as [code, lang] (lang)}
			<Option value={code} label={`${lang?.name} - ${lang?.nativeName}`} />
		{/each}
	</Select>
	<h2>
		{$_('settings.general.userInterface.autoplayTrailers')}
	</h2>
	<Toggle
		bind:checked={userSettings.interface.autoplayTrailers}
		name={saveSettings.fields.userAutoplayTrailers.as('checkbox').name}
	/>

	<h2>
		{$_('settings.general.userInterface.animationDuration')}
	</h2>
	<Input
		bind:value={userSettings.interface.animationDuration}
		name={saveSettings.fields.userAnimationDuration.as('number').name}
		type="number"
	/>

	<h1
		class="font-medium text-xl text-zinc-200 tracking-wide col-span-2 border-b border-zinc-800 justify-self-stretch pb-2 mt-8"
	>
		{$_('settings.general.discovery.discovery')}
	</h1>
	<h2>
		{$_('settings.general.discovery.region')}
	</h2>
	<Select
		bind:value={userSettings.discover.region}
		name={saveSettings.fields.userDiscoverRegion.as('select').name}
		selectedValues={userSettings.discover.region}
	>
		<Option label={$_('settings.general.discovery.none')} value="none" />
		{#each Object.entries(ISO_REGIONS) as [code, region] (region)}
			<Option value={code} label={region} />
		{/each}
	</Select>
	<h2>{$_('settings.general.discovery.excludeLibraryItemsFromDiscovery')}</h2>
	<Toggle
		bind:checked={userSettings.discover.excludeLibraryItems}
		name={saveSettings.fields.userDiscoverExcludeLibraryItems.as('checkbox').name}
	/>

	<div>
		<h2>
			{$_('settings.general.discovery.includedLanguages')}
		</h2>
		<p class="text-sm text-zinc-500 mt-1">
			{$_('settings.general.discovery.includedLanguagesDescription')}
		</p>
	</div>
	<Input
		bind:value={userSettings.discover.includedLanguages}
		name={saveSettings.fields.userDiscoverIncludedLanguages.as('text').name}
		placeholder="en,fr,de"
	/>
</div>
