<script lang="ts">
	import { getSonarrHealth, getSonarrRootFolders } from '$lib/apis/sonarr/sonarrApi';
	import { getRadarrHealth, getRadarrRootFolders } from '$lib/apis/radarr/radarrApi';
	import Input from '$lib/components/common/inputs/forms/Input.svelte';
	import Select from '$lib/components/common/inputs/forms/Select.svelte';
	import classNames from 'classnames';
	import { Trash } from 'svelte-radix';
	import IntegrationCard from './IntegrationCard.svelte';
	import TestConnectionButton from './TestConnectionButton.svelte';
	import { _ } from 'svelte-i18n';
	import { defaultGlobalSettings, type GlobalSettings } from '@reiverr/db/types';
	import { jellyfinTestConnection } from '$lib/apis/jellyfin/jellyfinApi';
	import Button from '$lib/components/common/inputs/buttons/Button.svelte';
	import { onMount } from 'svelte';
	import ConfirmDialog from '$lib/components/common/inputs/forms/ConfirmDialog.svelte';
	import Option from '$lib/components/common/inputs/forms/Option.svelte';
	import { saveSettings } from '$lib/remote/settings.remote';

	let {
		visible,
		globalSettings = $bindable()
	}: {
		visible: boolean;
		globalSettings: GlobalSettings;
	} = $props();

	let jellyfinConnected: boolean = $state(false);

	let radarrConnected: boolean = $state(false);
	let radarrRootFolders: undefined | { id: string; path: string }[] = $state();

	let sonarrConnected: boolean = $state(false);
	let sonarrRootFolders: undefined | { id: number; path: string }[] = $state();

	let confirmDialogVisible = $state(false);
	let confirmDialogMessage = $state('');
	let confirmDialogResolve: (confirm: boolean) => void;

	function showConfirmDialog(message: string): Promise<boolean> {
		confirmDialogMessage = message;
		confirmDialogVisible = true;
		return new Promise((resolve) => {
			confirmDialogResolve = resolve;
		});
	}

	function confirmDialog(confirm: boolean) {
		confirmDialogVisible = false;
		confirmDialogResolve(confirm);
	}

	async function updateJellyfinHealth(): Promise<boolean> {
		if (globalSettings.jellyfin.baseUrl) {
			return jellyfinTestConnection(
				globalSettings.jellyfin.baseUrl,
				globalSettings.jellyfin.apiKey || undefined
			).then((ok) => {
				jellyfinConnected = ok;
				return ok;
			});
		} else {
			jellyfinConnected = false;
			return false;
		}
	}

	async function updateRadarrHealth(): Promise<boolean> {
		if (globalSettings.radarr.baseUrl) {
			return getRadarrHealth(
				globalSettings.radarr.baseUrl,
				globalSettings.radarr.apiKey
			).then((ok) => {
				radarrConnected = ok;
				return ok;
			});
		} else {
			radarrConnected = false;
			return false;
		}
	}

	async function updateSonarrHealth(): Promise<boolean> {
		if (globalSettings.sonarr.baseUrl) {
			return getSonarrHealth(
				globalSettings.sonarr.baseUrl,
				globalSettings.sonarr.apiKey
			).then((ok) => {
				sonarrConnected = ok;
				return ok;
			});
		} else {
			sonarrConnected = false;
			return false;
		}
	}

	onMount(async () => {
		jellyfinConnected = await updateJellyfinHealth();
		radarrConnected = await updateRadarrHealth();
		sonarrConnected = await updateSonarrHealth();
	});

	async function removeIntegration(service: 'sonarr' | 'radarr') {
		let message: string;

		switch (service) {
			case 'radarr': {
				message = $_('settings.misc.radarrRemoveConfirmDialog');
				break;
			}
			case 'sonarr': {
				message = $_('settings.misc.sonarrRemoveConfirmDialog');
				break;
			}
			default: {
				message = '';
			}
		}

		let isConfirmed = await showConfirmDialog(message);
		if (isConfirmed) {
			await fetch(`/api/settings?integration=${service}`, {
				method: 'DELETE'
			});

			if (service === 'radarr') {
				globalSettings.radarr = defaultGlobalSettings.radarr;
				await updateRadarrHealth();
			} else if (service === 'sonarr') {
				globalSettings.sonarr = defaultGlobalSettings.sonarr;
				await updateSonarrHealth();
			}
		}
	}

	$effect(() => {
		if (sonarrConnected) {
			getSonarrRootFolders(globalSettings.sonarr.baseUrl, globalSettings.sonarr.apiKey).then(
				(folders) => {
					sonarrRootFolders = folders.map((f) => ({ id: f.id || 0, path: f.path || '' }));
				}
			);
		}

		if (radarrConnected) {
			getRadarrRootFolders(globalSettings.radarr.baseUrl, globalSettings.radarr.apiKey).then(
				(folders) => {
					radarrRootFolders = folders.map((f) => ({
						id: String(f.id) || '0',
						path: f.path || ''
					}));
				}
			);
		}
	});
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
			{$_('settings.integrations.integrations')}
		</h1>
	</div>

	<div class="justify-self-stretch col-span-2">
		<IntegrationCard status={sonarrConnected ? 'connected' : 'disconnected'} title="Sonarr">
			<div class="flex flex-col gap-1">
				<h2 class="text-sm text-zinc-500">
					{$_('settings.integrations.baseUrl')}
				</h2>
				<Input
					bind:value={globalSettings.sonarr.baseUrl}
					klass="w-full"
					name={saveSettings.fields.adminSonarrBaseUrl.as('text').name}
					placeholder="http://127.0.0.1:8989"
				/>
			</div>
			<div class="flex flex-col gap-1">
				<h2 class="text-sm text-zinc-500">
					{$_('settings.integrations.apiKey')}
				</h2>
				<Input
					bind:value={globalSettings.sonarr.apiKey}
					klass="w-full"
					name={saveSettings.fields.adminSonarrApiKey.as('password').name}
					type="password"
				/>
			</div>
			<div class="grid grid-cols-[1fr_min-content] gap-2">
				<TestConnectionButton handleHealthCheck={updateSonarrHealth} />
				<Button
					disabled={!sonarrConnected}
					onclick={() => removeIntegration('sonarr')}
					variant="error"
				>
					<Trash size="20" />
				</Button>
			</div>
			<h1 class="border-b border-zinc-800 py-2">
				{$_('settings.integrations.options.options')}
			</h1>
			<div
				class={classNames(
					'grid grid-cols-[1fr_min-content] justify-items-start gap-4 text-zinc-400',
					{
						'opacity-50 pointer-events-none': !sonarrConnected
					}
				)}
			>
				<h2>
					{$_('settings.integrations.options.rootFolder')}
				</h2>
				{#if !sonarrRootFolders}
					<Select loading />
				{:else}
					<Select
						bind:value={globalSettings.sonarr.rootFolderPath}
						name={saveSettings.fields.adminSonarrRootFolderPath.as('select').name}
						selectedValues={globalSettings.sonarr.rootFolderPath}
					>
						{#each sonarrRootFolders as folder (folder)}
							<Option value={folder.path} label={folder.path} />
						{/each}
					</Select>
				{/if}
			</div>
		</IntegrationCard>
	</div>

	<div class="justify-self-stretch col-span-2">
		<IntegrationCard status={radarrConnected ? 'connected' : 'disconnected'} title="Radarr">
			<div class="flex flex-col gap-1">
				<h2 class="text-sm text-zinc-500">
					{$_('settings.integrations.baseUrl')}
				</h2>
				<Input
					bind:value={globalSettings.radarr.baseUrl}
					klass="w-full"
					name={saveSettings.fields.adminRadarrBaseUrl.as('text').name}
					placeholder="http://127.0.0.1:7878"
				/>
			</div>
			<div class="flex flex-col gap-1">
				<h2 class="text-sm text-zinc-500">
					{$_('settings.integrations.apiKey')}
				</h2>
				<Input
					bind:value={globalSettings.radarr.apiKey}
					klass="w-full"
					name={saveSettings.fields.adminRadarrApiKey.as('password').name}
					type="password"
				/>
			</div>
			<div class="grid grid-cols-[1fr_min-content] gap-2">
				<TestConnectionButton handleHealthCheck={updateRadarrHealth} />
				<Button
					disabled={!radarrConnected}
					onclick={async () => await removeIntegration('radarr')}
					variant="error"
				>
					<Trash size="20" />
				</Button>
			</div>
			<h1 class="border-b border-zinc-800 py-2">
				{$_('settings.integrations.options.options')}
			</h1>
			<div
				class={classNames(
					'grid grid-cols-[1fr_min-content] justify-items-start gap-4 text-zinc-400',
					{
						'opacity-50 pointer-events-none': !radarrConnected
					}
				)}
			>
				<h2>
					{$_('settings.integrations.options.rootFolder')}
				</h2>
				{#if !radarrRootFolders}
					<Select loading />
				{:else}
					<Select
						bind:value={globalSettings.radarr.rootFolderPath}
						name={saveSettings.fields.adminRadarrRootFolderPath.as('select').name}
						selectedValues={globalSettings.radarr.rootFolderPath}
					>
						{#each radarrRootFolders as folder (folder)}
							<Option value={folder.path} label={folder.path} />
						{/each}
					</Select>
				{/if}
			</div>
		</IntegrationCard>
	</div>

	<div class="justify-self-stretch col-span-2">
		<IntegrationCard status={jellyfinConnected ? 'connected' : 'disconnected'} title="Jellyfin">
			<div class="flex flex-col gap-1">
				<h2 class="text-sm text-zinc-500">
					{$_('settings.integrations.baseUrl')}
				</h2>
				<Input
					bind:value={globalSettings.jellyfin.baseUrl}
					klass="w-full"
					name={saveSettings.fields.adminJellyfinBaseUrl.as('text').name}
					placeholder="http://127.0.0.1:8096"
				/>
			</div>
			<div class="flex flex-col gap-1">
				<h2 class="text-sm text-zinc-500">
					{$_('settings.integrations.apiKey')}
				</h2>
				<Input
					bind:value={globalSettings.jellyfin.apiKey}
					klass="w-full"
					name={saveSettings.fields.adminJellyfinApiKey.as('text').name}
					type="password"
				/>
			</div>
			<div class="grid grid-cols-[1fr_min-content]">
				<TestConnectionButton handleHealthCheck={updateJellyfinHealth} />
			</div>
		</IntegrationCard>
	</div>
</div>
{#if confirmDialogVisible}
	<ConfirmDialog
		variant="yesNo"
		onConfirm={confirmDialog}
		confirmMessage={confirmDialogMessage}
	/>
{/if}
