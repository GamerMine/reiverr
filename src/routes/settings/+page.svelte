<script lang="ts">
	import { version } from '$app/environment';
	import { getRadarrHealth } from '$lib/apis/radarr/radarrApi';
	import { getSonarrHealth } from '$lib/apis/sonarr/sonarrApi';
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
	import type { PageProps } from '../../../.svelte-kit/types/src/routes/settings/$types';
	import { enhance } from '$app/forms';
	import ConfirmDialog from '$lib/components/Forms/ConfirmDialog.svelte';

	type Section = 'general' | 'integrations';

	let { data }: PageProps = $props();

	let openTab: Section = $state('general');
	let errorMessage: string | undefined = $state();

	let currSettings: Settings = $state($state.snapshot(settings));
	let valuesChanged = $state(false);

	let confirmDialogVisible = $state(false);
	let confirmDialogMessage = $state('');
	let confirmDialogResolve: () => void;

	const getNavButtonStyle = (section: Section) =>
		classNames('rounded-xl p-2 px-6 font-medium text-left', {
			'text-zinc-200 bg-lighten': openTab === section,
			'text-zinc-300 hover:text-zinc-200': openTab !== section
		});

	function showConfirmDialog(message: string): Promise<void> {
		confirmDialogMessage = message;
		confirmDialogVisible = true;
		return new Promise((resolve) => {
			confirmDialogResolve = resolve;
		});
	}

	function confirmDialog() {
		confirmDialogVisible = false;
		confirmDialogResolve();
	}

	$effect(() => {
		if (errorMessage) {
			createErrorNotification($_('settings.misc.invalidConfiguration'), errorMessage);
			errorMessage = undefined;
		}

		if (currSettings.globalSettings.jellyfin.baseUrl.length === 0) {
			valuesChanged = false;
			return;
		}
		valuesChanged = JSON.stringify(settings) !== JSON.stringify(currSettings);
	});
</script>

<div
	class="min-h-screen sm:h-screen flex-1 flex flex-col sm:flex-row w-full sm:pt-24"
	in:fade|global={{
		duration: settings.userSettings.interface.animationDuration,
		delay: settings.userSettings.interface.animationDuration
	}}
	out:fade|global={{ duration: settings.userSettings.interface.animationDuration }}
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
			{#if data.isAdmin}
				<button
					onclick={() => (openTab = 'integrations')}
					class={openTab && getNavButtonStyle('integrations')}
				>
					{$_('settings.navbar.integrations')}
				</button>
			{/if}
		</div>
		<div class="flex flex-col gap-2">
			<Button type="submit" form="settingsForm" disabled={!valuesChanged} variant="success">
				{$_('settings.misc.saveChanges')}
			</Button>
			<!-- FIXME: Reset button disabled for now  -->
			<Button variant="error" onclick={() => {}}>
				{$_('settings.misc.resetToDefaults')}
			</Button>
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
			{#if data.isAdmin}
				<option value="integrations">
					{$_('settings.navbar.integrations')}
				</option>
			{/if}
		</Select>
	</div>

	<div class="flex-1 flex flex-col border-t border-zinc-800 justify-between">
		<div class="overflow-y-scroll overflow-x-hidden px-8">
			<form
				id="settingsForm"
				class="max-w-screen-md mx-auto mb-auto w-full"
				method="POST"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.data.needLogin) {
							await showConfirmDialog($_('settings.misc.jellyfinConfirmChangesDialog'));
						}
						await update();
						if (result.type !== 'success') {
							if (result.data?.code === 1) {
								errorMessage = $_('settings.misc.checkJellyfinCredentials');
							}
						} else if (result.data.needLogin) {
							window.location.href = '/login';
						} else {
							location.reload();
						}
					};
				}}
			>
				<GeneralSettingsPage
					visible={openTab === 'general'}
					bind:userSettings={currSettings.userSettings}
				/>

				{#if data.isAdmin}
					<IntegrationSettingsPage
						visible={openTab === 'integrations'}
						bind:globalSettings={currSettings.globalSettings}
					/>
				{/if}
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
{#if confirmDialogVisible}
	<ConfirmDialog onConfirm={confirmDialog} confirmMessage={confirmDialogMessage} />
{/if}
