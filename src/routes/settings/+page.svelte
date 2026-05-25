<script lang="ts">
	import { version } from '$app/environment';
	import Select from '$lib/components/common/inputs/forms/Select.svelte';
	import classNames from 'classnames';
	import { ChevronLeft } from 'svelte-radix';
	import GeneralSettingsPage from '$lib/components/page/settings/GeneralSettingsPage.svelte';
	import IntegrationSettingsPage from '$lib/components/page/settings/IntegrationSettingsPage.svelte';
	import { fade } from 'svelte/transition';
	import { _ } from 'svelte-i18n';
	import { createErrorNotification } from '$lib/stores/notification.store';
	import type { Settings } from '$lib/entities/Types';
	import { settings } from '$lib/stores/settings.svelte';
	import Button from '$lib/components/common/inputs/buttons/Button.svelte';
	import type { PageProps } from '../../../.svelte-kit/types/src/routes/settings/$types';
	import ConfirmDialog from '$lib/components/common/inputs/forms/ConfirmDialog.svelte';
	import FilteringConfigPage from '$lib/components/page/settings/FilteringConfigPage.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import Option from '$lib/components/common/inputs/forms/Option.svelte';
	import { saveSettings } from '$lib/remote/settings.remote';

	type Section = 'general' | 'integrations' | 'filtering';

	let { data }: PageProps = $props();

	let openTab: Section = $state('general');

	let currSettings: Settings = $state($state.snapshot(settings));
	let valuesChanged = $state(false);

	let confirmDialogVisible = $state(false);
	let confirmDialogMessage = $state('');
	let confirmDialogResolve: () => void;

	const getNavButtonStyle = (section: Section) =>
		classNames('rounded-xl p-2 px-6 font-medium text-left', {
			'text-black bg-lighten bg-amber-300': openTab === section,
			'text-zinc-300 hover:text-zinc-200': openTab !== section
		});

	function showConfirmDialog(message: string): Promise<void> {
		confirmDialogMessage = message;
		confirmDialogVisible = true;
		return new Promise((resolve) => {
			confirmDialogResolve = resolve;
		});
	}

	function confirmDialog(_: boolean) {
		confirmDialogVisible = false;
		confirmDialogResolve();
	}

	function setTab(section: Section) {
		openTab = section;
		goto(`?#${openTab}`);
	}

	onMount(() => {
		if (location.hash) openTab = location.hash.slice(1) as Section;
	});

	$effect(() => {
		if (saveSettings.result) {
			if (saveSettings.result.success) {
				if (saveSettings.result?.needLogin) {
					showConfirmDialog($_('settings.misc.jellyfinConfirmChangesDialog'));
				}
				location.reload(); // FIXME: Language should change dynamically (without reloading the page)
			} else {
				createErrorNotification($_('general.error'), 'TODO'); // TODO
			}
		}
		if (currSettings.globalSettings.jellyfin.baseUrl?.length === 0) {
			valuesChanged = false;
			return;
		}

		if (currSettings.globalSettings.radarr.baseUrl?.length === 0) {
			valuesChanged = false;
			return;
		}

		if (currSettings.globalSettings.sonarr.baseUrl?.length === 0) {
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
			<p class="text-xs text-zinc-500 mt-1">{$_('settings.navbar.userSettings')}</p>
			<button
				class={openTab && getNavButtonStyle('general')}
				onclick={() => setTab('general')}
			>
				{$_('settings.navbar.general')}
			</button>
			{#if data.isAdmin}
				<p class="text-xs text-zinc-500 mt-1">{$_('settings.navbar.adminSettings')}</p>
				<button
					onclick={() => setTab('integrations')}
					class={openTab && getNavButtonStyle('integrations')}
				>
					{$_('settings.navbar.integrations')}
				</button>
				{#if settings.globalSettings.radarr.baseUrl || settings.globalSettings.sonarr.baseUrl}
					<button
						onclick={() => setTab('filtering')}
						class={openTab && getNavButtonStyle('filtering')}
					>
						{$_('settings.navbar.filtering')}
					</button>
				{/if}
			{/if}
		</div>
		<div class="flex flex-col gap-2">
			<Button disabled={!valuesChanged} form="settingsForm" type="submit" variant="success">
				{$_('settings.misc.saveChanges')}
			</Button>
			<!-- FIXME: Reset button disabled for now  -->
			<Button onclick={() => {}} variant="error">
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
		<Select bind:value={openTab} selectedValues={openTab}>
			<Option label={$_('settings.navbar.general')} value="general" />
			{#if data.isAdmin}
				<Option value="integrations" label={$_('settings.navbar.integrations')} />
			{/if}
		</Select>
	</div>

	<div class="flex-1 flex flex-col border-t border-zinc-800 justify-between">
		<div class="overflow-y-auto overflow-x-hidden scrollbar-custom px-8 h-screen">
			<form {...saveSettings} class="max-w-3xl mx-auto mb-auto w-full" id="settingsForm">
				<GeneralSettingsPage
					bind:userSettings={currSettings.userSettings}
					visible={openTab === 'general'}
				/>

				{#if data.isAdmin}
					<IntegrationSettingsPage
						visible={openTab === 'integrations'}
						bind:globalSettings={currSettings.globalSettings}
					/>
					{#if settings.globalSettings.radarr.baseUrl || settings.globalSettings.sonarr.baseUrl}
						<FilteringConfigPage
							visible={openTab === 'filtering'}
							profiles={data.filteringProfiles}
							bind:globalSettings={currSettings.globalSettings}
						/>
					{/if}
				{/if}
			</form>
		</div>
		<div class="sm:hidden px-8 pt-4 flex flex-wrap items-center justify-center space-x-2">
			<Button disabled={!valuesChanged} form="settingsForm" type="submit" variant="success">
				{$_('settings.misc.saveChanges')}
			</Button>
			<!-- FIXME: Reset button disabled for now  -->
			<Button onclick={() => {}} variant="error">
				{$_('settings.misc.resetToDefaults')}
			</Button>
		</div>
		<div class="flex items-center p-4 gap-8 justify-center text-zinc-500 bg-stone-950">
			<div>v{version}</div>
			<a href="https://github.com/GamerMine/reiverr/releases" target="_blank">
				{$_('settings.misc.changelog')}
			</a>
			<a href="https://github.com/GamerMine/reiverr" target="_blank">GitHub</a>
		</div>
	</div>
</div>
{#if confirmDialogVisible}
	<ConfirmDialog
		variant="confirm"
		onConfirm={confirmDialog}
		confirmMessage={confirmDialogMessage}
	/>
{/if}
