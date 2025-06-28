<script lang="ts">
	import Select from '$lib/components/common/inputs/forms/Select.svelte';
	import { _ } from 'svelte-i18n';
	import classNames from 'classnames';
	import type { UserSettings } from '$lib/entities/Types';
	import { getRadarrQualityProfiles } from '$lib/apis/radarr/radarrApi';
	import { onMount } from 'svelte';

	let { visible, userSettings = $bindable() }: { visible: boolean; userSettings: UserSettings } =
		$props();

	onMount(() => {
		console.log(userSettings.radarr.defaultQualityProfileId);
	});
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
		Radarr
	</h1>
	<div>
		<h2>{$_('settings.radarr.preferedQualityProfile')}</h2>
		<p class="text-sm text-zinc-500 mt-1">
			{$_('settings.radarr.preferedQualityProfileDescription')}
		</p>
	</div>
	{#await getRadarrQualityProfiles()}
		<Select loading />
	{:then radarrQualityProfiles}
		<Select
			name="userDefaultQualityProfileId"
			bind:value={userSettings.radarr.defaultQualityProfileId}
		>
			<option value=""> {$_('settings.general.discovery.none')} </option>
			{#each radarrQualityProfiles as profile}
				<option value={String(profile.id)}>{profile.name}</option>
			{/each}
		</Select>
	{/await}
</div>
