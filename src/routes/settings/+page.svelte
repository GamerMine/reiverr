<script lang="ts">
	import { version } from '$app/env';
	import Select from '#lib/components/controls/Select.svelte';
	import classNames from 'classnames';
	import { ChevronLeft } from 'svelte-radix';
	import GeneralSettingsPage from '#lib/components/pages/GeneralSettingsPage.svelte';
	import IntegrationSettingsPage from '#lib/components/pages/IntegrationSettingsPage.svelte';
	import { fade } from 'svelte/transition';
	import { _ } from 'svelte-i18n';
	import { createErrorNotification } from '#lib/stores/notification.store.js';
	import type { Settings } from '@reiverr/db/types';
	import { settings } from '#lib/stores/settings.svelte.js';
	import Button from '#lib/components/controls/Button.svelte';
	import type { PageProps } from '../../../.svelte-kit/types/src/routes/settings/$types';
	import ConfirmDialog from '#lib/components/controls/ConfirmDialog.svelte';
	import FilteringConfigPage from '#lib/components/pages/FilteringConfigPage.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import Option from '#lib/components/controls/Option.svelte';
	import { saveSettings } from '#lib/remote/settings.remote.js';

	type Section = 'general' | 'userFiltering' | 'integrations' | 'filtering';

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
				if (saveSettings.result.data?.needLogin) {
					showConfirmDialog($_('settings.misc.jellyfinConfirmChangesDialog'));
				}
				location.reload(); // FIXME: Language should change dynamically (without reloading the page)
			} else {
				createErrorNotification(
					$_('general.error'),
					$_(saveSettings.result.error ?? 'general.unknownError')
				);
			}
		}
	});

	$effect(() => {
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
	class="flex min-h-screen w-full flex-1 flex-col sm:h-screen sm:flex-row sm:pt-24"
	in:fade|global={{
		duration: settings.userSettings.interface.animationDuration,
		delay: settings.userSettings.interface.animationDuration
	}}
	out:fade|global={{ duration: settings.userSettings.interface.animationDuration }}
>
	<div
		class="hidden w-64 flex-col justify-between gap-2 border-t border-r border-zinc-800 p-8 sm:flex"
	>
		<div class="flex flex-col gap-2">
			<button
				class="mb-6 flex items-center text-lg font-medium text-zinc-300 hover:text-zinc-200"
				onclick={() => history.back()}
			>
				<ChevronLeft size="22" />
				{$_('settings.navbar.settings')}
			</button>
			<p class="mt-1 text-xs text-zinc-500">{$_('settings.navbar.userSettings')}</p>
			<button
				class={openTab && getNavButtonStyle('general')}
				onclick={() => setTab('general')}
			>
				{$_('settings.navbar.general')}
			</button>
			{#if data.filteringProfiles}
				<button
					onclick={() => setTab('userFiltering')}
					class={openTab && getNavButtonStyle('userFiltering')}
				>
					{$_('settings.navbar.filtering')}
				</button>
			{/if}
			{#if data.isAdmin}
				<p class="mt-1 text-xs text-zinc-500">{$_('settings.navbar.adminSettings')}</p>
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

	<div class="flex items-center justify-between px-8 pt-20 pb-4 sm:hidden">
		<button
			class="flex items-center text-lg font-medium text-zinc-300 hover:text-zinc-200"
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

	<div class="flex flex-1 flex-col justify-between border-t border-zinc-800">
		<div class="h-screen scrollbar-custom overflow-x-hidden overflow-y-auto px-8">
			<form {...saveSettings} class="mx-auto mb-auto w-full max-w-3xl" id="settingsForm">
				<GeneralSettingsPage
					bind:userSettings={currSettings.userSettings}
					visible={openTab === 'general'}
				/>
				<FilteringConfigPage
					visible={openTab === 'userFiltering'}
					profiles={data.filteringProfiles}
					bind:userFilteringProfileId={settings.userSettings.filteringProfileId}
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
		<div class="flex flex-wrap items-center justify-center space-x-2 px-8 pt-4 sm:hidden">
			<Button disabled={!valuesChanged} form="settingsForm" type="submit" variant="success">
				{$_('settings.misc.saveChanges')}
			</Button>
			<!-- FIXME: Reset button disabled for now  -->
			<Button onclick={() => {}} variant="error">
				{$_('settings.misc.resetToDefaults')}
			</Button>
		</div>
		<div class="flex items-center justify-center gap-8 bg-stone-950 p-4 text-zinc-500">
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
