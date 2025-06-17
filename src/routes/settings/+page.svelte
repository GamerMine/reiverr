<script lang="ts">
	import { version } from '$app/environment';
	import { jellyfinTestConnection } from '$lib/apis/jellyfin/jellyfinApi';
	import { getRadarrHealth } from '$lib/apis/radarr/radarrApi';
	import { getSonarrHealth } from '$lib/apis/sonarr/sonarrApi';
	import FormButton from '$lib/components/Forms/FormButton.svelte';
	import Select from '$lib/components/Forms/Select.svelte';
	import classNames from 'classnames';
	import { ChevronLeft } from 'svelte-radix';
	import GeneralSettingsPage from './GeneralSettingsPage.svelte';
	import IntegrationSettingsPage from './IntegrationSettingsPage.svelte';
	import { fade } from 'svelte/transition';
	import { _ } from 'svelte-i18n';
	import { createErrorNotification } from '$lib/stores/notification.store';
	import type { Settings } from '$lib/entities/Types';
	import { settings } from '$lib/stores/settings.svelte';
	import Button from '$lib/components/Button.svelte';

	type Section = 'general' | 'integrations';

	let openTab: Section = $state('general');

	let sonarrConnected = $state(false);
	let radarrConnected = $state(false);
	let jellyfinConnected = $state(false);

	let initialSettings: Settings = settings;
	let currSettings: Settings = $state($state.snapshot(initialSettings));

	let valuesChanged = $state(false);

	async function updateSonarrHealth(): Promise<boolean | undefined> {
		return new Promise(() => false);
	}

	async function updateRadarrHealth(): Promise<boolean | undefined> {
		return new Promise(() => false);
	}

	async function updateJellyfinHealth(): Promise<boolean | undefined> {
		if (currSettings.globalSettings.jellyfin.baseUrl) {
			return jellyfinTestConnection(
				currSettings.globalSettings.jellyfin.baseUrl,
				currSettings.globalSettings.jellyfin.apiKey || undefined
			).then((ok) => {
				jellyfinConnected = ok;
				return ok;
			});
		} else {
			jellyfinConnected = false;
			return false;
		}
	}

	const getNavButtonStyle = (section: Section) =>
		classNames('rounded-xl p-2 px-6 font-medium text-left', {
			'text-zinc-200 bg-lighten': openTab === section,
			'text-zinc-300 hover:text-zinc-200': openTab !== section
		});

	$effect(() => {
		valuesChanged = JSON.stringify(initialSettings) !== JSON.stringify(currSettings);
	});
</script>

<div
	class="min-h-screen sm:h-screen flex-1 flex flex-col sm:flex-row w-full sm:pt-24"
	in:fade|global={{
		duration: initialSettings.userSettings.interface.animationDuration,
		delay: initialSettings.userSettings.interface.animationDuration
	}}
	out:fade|global={{ duration: initialSettings.userSettings.interface.animationDuration }}
>
	<div
		class="hidden sm:flex flex-col gap-2 border-r border-zinc-800 justify-between w-64 p-8 border-t"
	>
		<div class="flex flex-col gap-2">
			<button
				class="mb-6 text-lg font-medium flex items-center text-zinc-300 hover:text-zinc-200"
				onclick={() => history.back()}
			>
				<ChevronLeft size="22" />
				{$_('settings.navbar.settings')}
			</button>
			<button onclick={() => (openTab = 'general')} class={openTab && getNavButtonStyle('general')}>
				{$_('settings.navbar.general')}
			</button>
			<button
				onclick={() => (openTab = 'integrations')}
				class={openTab && getNavButtonStyle('integrations')}
			>
				{$_('settings.navbar.integrations')}
			</button>
		</div>
		<div class="flex flex-col gap-2">
			<Button type="submit" form="settingsForm" disabled={!valuesChanged} variant="success">
				{$_('settings.misc.saveChanges')}
			</Button>
			<!-- FIXME: Reset button disabled for now  -->
			<!--<FormButton
				disabled={!valuesChanged}
				type="error"
				onclick={() => {
					settings.set(initialValues);
				}}
			>
				{$_('settings.misc.resetToDefaults')}
			</FormButton>-->
		</div>
	</div>

	<div class="sm:hidden px-8 pt-20 pb-4 flex items-center justify-between">
		<button
			class="text-lg font-medium flex items-center text-zinc-300 hover:text-zinc-200"
			onclick={() => history.back()}
		>
			<ChevronLeft size="22" />
			{$_('settings.navbar.settings')}
		</button>
		<Select bind:value={openTab}>
			<option value="general"> {$_('settings.navbar.general')} </option>
			<option value="integrations">
				{$_('settings.navbar.integrations')}
			</option>
		</Select>
	</div>

	<div class="flex-1 flex flex-col border-t border-zinc-800 justify-between">
		<div class="overflow-y-scroll overflow-x-hidden px-8">
			<form id="settingsForm" class="max-w-screen-md mx-auto mb-auto w-full" method="POST">
				<GeneralSettingsPage
					visible={openTab === 'general'}
					bind:userSettings={currSettings.userSettings}
				/>

				<IntegrationSettingsPage
					visible={openTab === 'integrations'}
					{sonarrConnected}
					{radarrConnected}
					{jellyfinConnected}
					{updateSonarrHealth}
					{updateRadarrHealth}
					{updateJellyfinHealth}
				/>
			</form>
		</div>
		<div class="flex items-center p-4 gap-8 justify-center text-zinc-500 bg-stone-950">
			<div>v{version}</div>
			<a target="_blank" href="https://github.com/GamerMine/reiverr/releases">
				{$_('settings.misc.changelog')}
			</a>
			<a target="_blank" href="https://github.com/GamerMine/reiverr">GitHub</a>
		</div>
	</div>
</div>

<!-- Language settings -->
