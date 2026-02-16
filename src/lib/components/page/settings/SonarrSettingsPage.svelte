<script lang="ts">
	import Select from '$lib/components/common/inputs/forms/Select.svelte';
	import { _ } from 'svelte-i18n';
	import classNames from 'classnames';
	import type { UserSettings } from '$lib/entities/Types';
	import { getSonarrQualityProfiles } from '$lib/apis/sonarr/sonarrApi.js';
	import Toggle from "$lib/components/common/inputs/forms/Toggle.svelte";

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
		Sonarr
	</h1>
	<div>
		<h2>{$_('settings.sonarr.preferedQualityProfile')}</h2>
		<p class="text-sm text-zinc-500 mt-1">
			{$_('settings.sonarr.preferedQualityProfileDescription')}
		</p>
	</div>
	{#await getSonarrQualityProfiles()}
		<Select loading />
	{:then sonarrQualityProfiles}
		<Select
			name="userSonarrDefaultQualityProfileId"
			bind:value={userSettings.sonarr.defaultQualityProfileId}
		>
			<option value=""> {$_('settings.general.discovery.none')} </option>
			{#each sonarrQualityProfiles as profile}
				<option value={String(profile.id)}>{profile.name}</option>
			{/each}
		</Select>
	{/await}
	<div>
		<h2>
			{$_('settings.sonarr.askQualityProfile')}
		</h2>
		<p class="text-sm text-zinc-500 mt-1">
			{$_('settings.sonarr.askQualityProfileDescription')}
		</p>
	</div>
	<Toggle name="userSonarrAskQualityProfile" bind:checked={userSettings.sonarr.askQualityProfile} />
</div>
