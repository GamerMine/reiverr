<script lang="ts">
	import {
		getSonarrLanguageProfiles,
		getSonarrQualityProfiles,
		getSonarrRootFolders,
		getSonarrMonitors
	} from '$lib/apis/sonarr/sonarrApi';
	import { getRadarrMonitors } from '$lib/apis/radarr/radarrApi';
	import FormButton from '$lib/components/forms/FormButton.svelte';
	import Input from '$lib/components/forms/Input.svelte';
	import Select from '$lib/components/forms/Select.svelte';
	import { settings, type SettingsValues } from '$lib/stores/settings.store';
	import classNames from 'classnames';
	import { Trash } from 'svelte-radix';
	import IntegrationCard from './IntegrationCard.svelte';
	import TestConnectionButton from './TestConnectionButton.svelte';
	import { getRadarrQualityProfiles, getRadarrRootFolders } from '$lib/apis/radarr/radarrApi';
	import { _ } from 'svelte-i18n';
	import { defaultSettings } from '$lib/stores/settings.store';
	import Toggle from '$lib/components/forms/Toggle.svelte';

	let {
		values = $bindable(),

		sonarrConnected,
		radarrConnected,
		jellyfinConnected,

		updateSonarrHealth,
		updateRadarrHealth,
		updateJellyfinHealth
	}: {
		values: SettingsValues;

		sonarrConnected: boolean;
		radarrConnected: boolean;
		jellyfinConnected: boolean;

		updateSonarrHealth: (reset?: boolean) => Promise<boolean | undefined>;
		updateRadarrHealth: (reset?: boolean) => Promise<boolean | undefined>;
		updateJellyfinHealth: (reset?: boolean) => Promise<boolean | undefined>;
	} = $props();

	let sonarrRootFolders: undefined | { id: number; path: string }[] = $state();
	let sonarrQualityProfiles: undefined | { id: number; name: string }[] = $state();
	let sonarrLanguageProfiles: undefined | { id: number; name: string }[] = $state();
	let sonarrMonitors: undefined | { id: number; type: string }[] = $state();

	let radarrRootFolders: undefined | { id: number; path: string }[] = $state();
	let radarrQualityProfiles: undefined | { id: number; name: string }[] = $state();
	let radarrMonitors: undefined | { id: number; type: string }[] = $state();

	function handleRemoveIntegration(service: 'sonarr' | 'radarr' | 'jellyfin') {
		if (service === 'sonarr') {
			values.sonarr.baseUrl = '';
			values.sonarr.apiKey = '';

			updateSonarrHealth();
		} else if (service === 'radarr') {
			values.radarr.baseUrl = '';
			values.radarr.apiKey = '';
			updateRadarrHealth();
		} else if (service === 'jellyfin') {
			values.jellyfin.baseUrl = '';
			values.jellyfin.apiKey = '';
			updateJellyfinHealth();
		}
	}

	$effect(() => {
		if (sonarrConnected) {
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
			getRadarrMonitors().then((mon) => {
				radarrMonitors = mon.map((p, index) => ({ id: index || 0, type: p || '' }));
			});
		}

		if (radarrConnected) {
			getRadarrRootFolders(
				values.radarr.baseUrl || undefined,
				values.radarr.apiKey || undefined
			).then((folders) => {
				radarrRootFolders = folders.map((f) => ({ id: f.id || 0, path: f.path || '' }));
			});

			getRadarrQualityProfiles(
				values.radarr.baseUrl || undefined,
				values.radarr.apiKey || undefined
			).then((profiles) => {
				radarrQualityProfiles = profiles.map((p) => ({ id: p.id || 0, name: p.name || '' }));
			});
		}
	});
</script>

<div class="grid grid-cols-2 gap-4">
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

	<div class="justify-self-stretch col-span-2">
		<IntegrationCard
			title="Sonarr"
			href={$settings.sonarr.baseUrl || '#'}
			status={sonarrConnected ? 'connected' : 'disconnected'}
		>
			<div class="flex flex-col gap-1">
				<h2 class="text-sm text-zinc-500">
					{$_('settings.integrations.baseUrl')}
				</h2>
				<Input
					placeholder={'http://127.0.0.1:8989'}
					klass="w-full"
					bind:value={values.sonarr.baseUrl}
					onchange={() => updateSonarrHealth(true)}
				/>
			</div>
			<div class="flex flex-col gap-1">
				<h2 class="text-sm text-zinc-500">
					{$_('settings.integrations.apiKey')}
				</h2>
				<Input
					klass="w-full"
					bind:value={values.sonarr.apiKey}
					onchange={() => updateSonarrHealth(true)}
				/>
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
					<Select bind:value={values.sonarr.rootFolderPath}>
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
					<Select bind:value={values.sonarr.qualityProfileId}>
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
					<Select bind:value={values.sonarr.languageProfileId}>
						{#each sonarrLanguageProfiles as profile}
							<option value={profile.id}>{profile.name}</option>
						{/each}
					</Select>
				{/if}
				<h2>Monitor Series</h2>
				{#if !sonarrMonitors}
					<Select loading />
				{:else}
					<Select bind:value={values.sonarr.monitor}>
						{#each sonarrMonitors as profile}
							<option value={profile.id}>{profile.type}</option>
						{/each}
					</Select>
				{/if}
				<h2>Start searching for new episodes</h2>
				{#if defaultSettings.sonarr.StartSearch === undefined}
					<Select loading />
				{:else}
					<Toggle bind:checked={values.sonarr.StartSearch} />
				{/if}
			</div>
		</IntegrationCard>
	</div>

	<div class="justify-self-stretch col-span-2">
		<IntegrationCard
			title="Radarr"
			href={$settings.radarr.baseUrl || '#'}
			status={radarrConnected ? 'connected' : 'disconnected'}
		>
			<div class="flex flex-col gap-1">
				<h2 class="text-sm text-zinc-500">
					{$_('settings.integrations.baseUrl')}
				</h2>
				<Input
					placeholder={'http://127.0.0.1:7878'}
					klass="w-full"
					bind:value={values.radarr.baseUrl}
					onchange={() => updateRadarrHealth(true)}
				/>
			</div>
			<div class="flex flex-col gap-1">
				<h2 class="text-sm text-zinc-500">
					{$_('settings.integrations.apiKey')}
				</h2>
				<Input
					klass="w-full"
					bind:value={values.radarr.apiKey}
					onchange={() => updateRadarrHealth(true)}
				/>
			</div>
			<div class="grid grid-cols-[1fr_min-content] gap-2">
				<TestConnectionButton handleHealthCheck={updateRadarrHealth} />
				<FormButton onclick={() => handleRemoveIntegration('radarr')} type="error">
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
					<Select bind:value={values.radarr.rootFolderPath}>
						{#each radarrRootFolders as folder}
							<option value={folder.path}>{folder.path}</option>
						{/each}
					</Select>
				{/if}

				<h2>
					{$_('settings.integrations.options.qualityProfile')}
					<!-- FIXME: Instead of selecting a profile that will be used by every movies. This settings should be either
					 						removed or a default selection when a user tries to ask for a movie -->
				</h2>
				{#if !radarrQualityProfiles}
					<Select loading />
				{:else}
					<Select bind:value={values.radarr.qualityProfileId}>
						{#each radarrQualityProfiles as profile}
							<option value={profile.id}>{profile.name}</option>
						{/each}
					</Select>
				{/if}
				<h2>Monitor Movies</h2>
				<!-- FIXME: This should not be set by the user. A movie should be automatically monitored on Radarr -->
				{#if !radarrMonitors}
					<Select loading />
				{:else}
					<Select bind:value={values.radarr.monitor}>
						{#each radarrMonitors as profile}
							<option value={profile.id}>{profile.type}</option>
						{/each}
					</Select>
				{/if}
				<h2>{$_('settings.integrations.options.searchForMovie')}</h2>
				<!-- FIXME: This should not be set by the user. A movie should be automatically searched on Radarr if it's
											release date is older than the current date. Otherwise, it must be only marked as "monitored". -->
				{#if defaultSettings.radarr.startSearch === undefined}
					<Select loading />
				{:else}
					<Toggle bind:checked={values.radarr.startSearch} />
				{/if}
			</div>
		</IntegrationCard>
	</div>

	<div class="justify-self-stretch col-span-2">
		<IntegrationCard
			title="Jellyfin"
			href={$settings.jellyfin.baseUrl || '#'}
			status={jellyfinConnected ? 'connected' : 'disconnected'}
		>
			<div class="flex flex-col gap-1">
				<h2 class="text-sm text-zinc-500">
					{$_('settings.integrations.baseUrl')}
				</h2>
				<Input
					placeholder={'http://127.0.0.1:8096'}
					klass="w-full"
					bind:value={values.jellyfin.baseUrl}
				/>
			</div>
			<div class="flex flex-col gap-1">
				<h2 class="text-sm text-zinc-500">
					{$_('settings.integrations.apiKey')}
				</h2>
				<Input klass="w-full" bind:value={values.jellyfin.apiKey} />
			</div>
			<div class="grid grid-cols-[1fr_min-content] gap-2">
				<TestConnectionButton handleHealthCheck={updateJellyfinHealth} />
				<FormButton onclick={() => handleRemoveIntegration('jellyfin')} type="error">
					<Trash size="20" />
				</FormButton>
			</div>
		</IntegrationCard>
	</div>
</div>
