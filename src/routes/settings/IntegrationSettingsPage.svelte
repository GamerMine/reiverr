<script lang="ts">
	import {
		getSonarrLanguageProfiles,
		getSonarrQualityProfiles,
		getSonarrRootFolders,
		getSonarrMonitors
	} from '$lib/apis/sonarr/sonarrApi';
	import { getRadarrHealth, getRadarrMonitors } from '$lib/apis/radarr/radarrApi';
	import Input from '$lib/components/common/inputs/forms/Input.svelte';
	import Select from '$lib/components/common/inputs/forms/Select.svelte';
	import classNames from 'classnames';
	import { Trash } from 'svelte-radix';
	import IntegrationCard from './IntegrationCard.svelte';
	import TestConnectionButton from './TestConnectionButton.svelte';
	import { getRadarrRootFolders } from '$lib/apis/radarr/radarrApi';
	import { _ } from 'svelte-i18n';
	import Toggle from '$lib/components/common/inputs/forms/Toggle.svelte';
	import type { GlobalSettings } from '$lib/entities/Types';
	import { jellyfinTestConnection } from '$lib/apis/jellyfin/jellyfinApi';
	import Button from '$lib/components/common/inputs/buttons/Button.svelte';
	import { onMount } from 'svelte';

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
	let radarrMonitors: undefined | { id: string; type: string }[] = $state();

	/*let sonarrRootFolders: undefined | { id: number; path: string }[] = $state();
	let sonarrQualityProfiles: undefined | { id: number; name: string }[] = $state();
	let sonarrLanguageProfiles: undefined | { id: number; name: string }[] = $state();
	let sonarrMonitors: undefined | { id: number; type: string }[] = $state();*/

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
				globalSettings.radarr.apiKey || undefined
			).then((ok) => {
				radarrConnected = ok;
				return ok;
			});
		} else {
			radarrConnected = false;
			return false;
		}
	}

	onMount(async () => {
		jellyfinConnected = await updateJellyfinHealth();
		radarrConnected = await updateRadarrHealth();
	});

	/*function handleRemoveIntegration(service: 'sonarr' | 'radarr') {
		// TODO: Handle integration remove with internal API endpoint
		if (service === 'sonarr') {
			updateSonarrHealth();
		} else if (service === 'radarr') {
			updateRadarrHealth();
		}
	}*/

	$effect(() => {
		/*if (sonarrConnected) {
			getSonarrRootFolders(
				values.sonarr.baseUrl || undefined,
				values.sonarr.apiKey || undefined
			).then((folders) => {
				sonarrRootFolders = folders.map((f) => ({ id: f.id || 0, path: f.path || '' }));
			});

			getSonarrQualityProfiles(
				values.sonarr.baseUrl || undefined,
				values.sonarr.apiKey || undefined
			).then((profiles) => {
				sonarrQualityProfiles = profiles.map((p) => ({ id: p.id || 0, name: p.name || '' }));
			});

			getSonarrLanguageProfiles(
				values.sonarr.baseUrl || undefined,
				values.sonarr.apiKey || undefined
			).then((profiles) => {
				sonarrLanguageProfiles = profiles.map((p) => ({ id: p.id || 0, name: p.name || '' }));
			});
			getSonarrMonitors().then((mon) => {
				sonarrMonitors = mon.map((p, index) => ({ id: index || 0, type: p || '' }));
			});
		}*/

		if (radarrConnected) {
			getRadarrRootFolders(
				globalSettings.radarr.baseUrl || undefined,
				globalSettings.radarr.apiKey || undefined
			).then((folders) => {
				radarrRootFolders = folders.map((f) => ({ id: String(f.id) || '0', path: f.path || '' }));
			});

			getRadarrMonitors().then((mon) => {
				radarrMonitors = mon.map((p, index) => ({ id: String(index) || '0', type: p || '' }));
			});
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
		<p class="text-sm text-zinc-400">
			<!--- @html to render underline class-->
			{@html $_('settings.integrations.integrationsNote')}
		</p>
	</div>

	<!--<div class="justify-self-stretch col-span-2">
		<IntegrationCard title="Sonarr" status={sonarrConnected ? 'connected' : 'disconnected'}>
			<div class="flex flex-col gap-1">
				<h2 class="text-sm text-zinc-500">
					{$_('settings.integrations.baseUrl')}
				</h2>
				<Input
					name="adminSonarrBaseUrl"
					placeholder={'http://127.0.0.1:8989'}
					klass="w-full"
					onchange={() => updateSonarrHealth(true)}
				/>
			</div>
			<div class="flex flex-col gap-1">
				<h2 class="text-sm text-zinc-500">
					{$_('settings.integrations.apiKey')}
				</h2>
				<Input name="adminSonarrApiKey" klass="w-full" onchange={() => updateSonarrHealth(true)} />
			</div>
			<div class="grid grid-cols-[1fr_min-content] gap-2">
				<TestConnectionButton handleHealthCheck={updateSonarrHealth} />
				<FormButton onclick={() => handleRemoveIntegration('sonarr')} type="error">
					<Trash size="20" />
				</FormButton>
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
					<Select name="adminSonarrRootFolderPath">
						{#each sonarrRootFolders as folder}
							<option value={folder.path}>{folder.path}</option>
						{/each}
					</Select>
				{/if}

				<h2>
					{$_('settings.integrations.options.qualityProfile')}
				</h2>
				{#if !sonarrQualityProfiles}
					<Select loading />
				{:else}
					<Select name="adminSonarrQualityProfileId">
						{#each sonarrQualityProfiles as profile}
							<option value={profile.id}>{profile.name}</option>
						{/each}
					</Select>
				{/if}

				<h2>
					{$_('settings.integrations.options.languageProfile')}
				</h2>
				{#if !sonarrLanguageProfiles}
					<Select loading />
				{:else}
					<Select name="adminSonarrLanguageProfileId">
						{#each sonarrLanguageProfiles as profile}
							<option value={profile.id}>{profile.name}</option>
						{/each}
					</Select>
				{/if}
				<h2>Monitor Series</h2>
				{#if !sonarrMonitors}
					<Select loading />
				{:else}
					<Select name="adminSonarrMonitor">
						{#each sonarrMonitors as profile}
							<option value={profile.id}>{profile.type}</option>
						{/each}
					</Select>
				{/if}
				<h2>Start searching for new episodes</h2>
				{#if defaultSettings.sonarr.StartSearch === undefined}
					<Select loading />
				{:else}
					<Toggle name="adminSonarrStartSearch" />
				{/if}
			</div>
		</IntegrationCard>
	</div>-->

	<div class="justify-self-stretch col-span-2">
		<IntegrationCard title="Radarr" status={radarrConnected ? 'connected' : 'disconnected'}>
			<div class="flex flex-col gap-1">
				<h2 class="text-sm text-zinc-500">
					{$_('settings.integrations.baseUrl')}
				</h2>
				<Input
					bind:value={globalSettings.radarr.baseUrl}
					name="adminRadarrBaseUrl"
					placeholder={'http://127.0.0.1:7878'}
					klass="w-full"
				/>
			</div>
			<div class="flex flex-col gap-1">
				<h2 class="text-sm text-zinc-500">
					{$_('settings.integrations.apiKey')}
				</h2>
				<Input
					bind:value={globalSettings.radarr.apiKey}
					name="adminRadarrApiKey"
					type="password"
					klass="w-full"
				/>
			</div>
			<div class="grid grid-cols-[1fr_min-content] gap-2">
				<TestConnectionButton handleHealthCheck={updateRadarrHealth} />
				<Button onclick={() => handleRemoveIntegration('radarr')} variant="error">
					<!-- TODO: handleRemoveIntegration -->
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
						name="adminRadarrRootFolderPath"
					>
						{#each radarrRootFolders as folder}
							<option value={folder.path}>{folder.path}</option>
						{/each}
					</Select>
				{/if}

				<h2>Monitor Movies</h2>
				<!-- FIXME: This should not be set by the user. A movie should be automatically monitored on Radarr -->
				{#if !radarrMonitors}
					<Select loading />
				{:else}
					<Select bind:value={globalSettings.radarr.monitor} name="adminRadarrMonitor">
						{#each radarrMonitors as profile}
							<option value={profile.id}>{profile.type}</option>
						{/each}
					</Select>
				{/if}
				<h2>{$_('settings.integrations.options.searchForMovie')}</h2>
				<!-- FIXME: This should not be set by the user. A movie should be automatically searched
										on Radarr if it's release date is older than the current date. Otherwise, it must be only marked
										as "monitored". -->
				{#if globalSettings.radarr.startSearch === undefined}
					<Select loading />
				{:else}
					<Toggle bind:checked={globalSettings.radarr.startSearch} name="adminRadarrStartSearch" />
				{/if}
			</div>
		</IntegrationCard>
	</div>

	<div class="justify-self-stretch col-span-2">
		<IntegrationCard title="Jellyfin" status={jellyfinConnected ? 'connected' : 'disconnected'}>
			<div class="flex flex-col gap-1">
				<h2 class="text-sm text-zinc-500">
					{$_('settings.integrations.baseUrl')}
				</h2>
				<Input
					name="adminJellyfinBaseUrl"
					bind:value={globalSettings.jellyfin.baseUrl}
					placeholder={'http://127.0.0.1:8096'}
					klass="w-full"
				/>
			</div>
			<div class="flex flex-col gap-1">
				<h2 class="text-sm text-zinc-500">
					{$_('settings.integrations.apiKey')}
				</h2>
				<Input
					name="adminJellyfinApiKey"
					bind:value={globalSettings.jellyfin.apiKey}
					type="password"
					klass="w-full"
				/>
			</div>
			<div class="grid grid-cols-[1fr_min-content]">
				<TestConnectionButton handleHealthCheck={updateJellyfinHealth} />
			</div>
		</IntegrationCard>
	</div>
</div>
