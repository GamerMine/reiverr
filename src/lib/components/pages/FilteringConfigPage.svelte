<script lang="ts">
	import classNames from 'classnames';
	import { _ } from 'svelte-i18n';
	import Toggle from '#lib/components/controls/Toggle.svelte';
	import { Plus, StarFilled, Star, Trash } from 'svelte-radix';
	import { modalStack } from '#lib/stores/modal.store.js';
	import FilteringProfileModal from '#lib/components/modals/FilteringProfileModal.svelte';
	import type { FilteringProfile, GlobalSettings } from '@unifarr/db';
	import { deleteFilteringProfile, saveSettings } from '#lib/remote/settings.remote.js';
	import { refreshAll } from '$app/navigation';
	import {
		createErrorNotification,
		createSuccessNotification
	} from '#lib/stores/notification.store.js';
	import { LANGUAGES } from '#lib/utils/constants.js';
	import Select from '#lib/components/controls/Select.svelte';
	import Option from '#lib/components/controls/Option.svelte';
	import { onMount } from 'svelte';

	let {
		visible,
		profiles = [],
		globalSettings = $bindable(),
		userFilteringProfileId = $bindable()
	}: {
		visible: boolean;
		profiles?: FilteringProfile[];
		globalSettings?: GlobalSettings | undefined;
		userFilteringProfileId?: number | undefined;
	} = $props();

	let defaultProfileId: number | undefined = $state();

	function addProfile(e: MouseEvent) {
		e.preventDefault();
		modalStack.create(FilteringProfileModal, {});
	}

	function editProfile(e: MouseEvent, profile: FilteringProfile) {
		e.preventDefault();
		modalStack.create(FilteringProfileModal, {
			editProfile: profile
		});
	}

	async function deleteProfile(e: MouseEvent, profile: FilteringProfile) {
		e.stopPropagation();
		const res = await deleteFilteringProfile(profile);
		await refreshAll();
		if (res.success) {
			createSuccessNotification(
				$_('general.success'),
				$_('settings.filtering.filteringProfileDeleteSuccess')
			);
		} else {
			createErrorNotification($_('general.error'), $_(res.error ?? 'general.unknownError'));
		}
	}

	$effect(() => {
		if (!globalSettings) {
			if (userFilteringProfileId && profiles.find((p) => p.id === userFilteringProfileId)) {
				// There can be an edge case when an admin deletes a profile, and, a new profile gets
				// the same ID. In that case the default user profile would be the new one even though
				// it's different.
				defaultProfileId = userFilteringProfileId;
				return;
			}
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
		class="col-span-2 mt-8 flex flex-col gap-2 justify-self-stretch border-b border-zinc-800 pb-4"
	>
		<h1 class="text-2xl font-medium tracking-wide text-zinc-200">
			{$_('settings.filtering.filteringProfiles')}
		</h1>
		{#if !globalSettings}
			<p class="mt-1 text-sm text-zinc-500">
				{$_('settings.filtering.filteringProfilesDescription')}
			</p>
		{/if}
	</div>
	{#if globalSettings}
		<div>
			<h2>
				{$_('settings.filtering.letUserChoose')}
			</h2>
			<p class="mt-1 text-sm text-zinc-500">
				{$_('settings.filtering.letUserChooseDescription')}
			</p>
		</div>
		<Toggle
			bind:checked={globalSettings.general.userCanChooseProfile}
			name={saveSettings.fields.adminUserCanChooseProfile.as('checkbox').name}
		/>
		<h2>
			{$_('settings.filtering.languages')}
		</h2>
		<Select
			bind:selectedValues={globalSettings.general.downloadLanguages}
			multiple
			name={saveSettings.fields.adminDownloadLanguages.as('select multiple').name}
		>
			{#each LANGUAGES as lang (lang)}
				<Option value={lang} label={$_('languages.' + lang)} />
			{/each}
		</Select>
	{/if}

	<div class="col-span-2 my-8 flex flex-wrap gap-2">
		{#if globalSettings}
			<button
				class="flex h-50 w-80 items-center justify-center rounded-md bg-neutral-900 transition-colors duration-200 hover:cursor-pointer hover:bg-neutral-800"
				onclick={addProfile}
			>
				<Plus size="40" />
				<h2>{$_('settings.filtering.addProfile')}</h2>
			</button>
		{/if}
		{#each profiles as profile (profile)}
			{@const isDefault = defaultProfileId
				? profile.id === defaultProfileId
				: !!profile.isDefault}
			<button
				class={classNames(
					'flex h-50 w-80 overflow-hidden rounded-md bg-neutral-900 transition-colors duration-200 hover:bg-neutral-800',
					{ 'hover:cursor-default': !globalSettings }
				)}
				onclick={(e) => {
					if (globalSettings) {
						editProfile(e, profile);
					} else e.preventDefault();
				}}
			>
				<div class="w-full p-4">
					<div class="flex justify-between">
						<p class="flex items-center text-start text-xl font-bold">
							{profile.name}&nbsp<span class={isDefault ? 'visible' : 'hidden'}
								><StarFilled /></span
							>
						</p>
						{#if globalSettings}
							<Trash
								class="rounded-md bg-red-700 p-1 transition-colors duration-100 hover:bg-red-900"
								size="30"
								onclick={(e) => deleteProfile(e, profile)}
							/>
						{:else}
							<Star
								color="black"
								class={classNames(
									'rounded-md bg-white p-1 transition-colors duration-200 hover:cursor-pointer hover:bg-neutral-300',
									{ visible: !isDefault, hidden: isDefault }
								)}
								size="30"
								onclick={() => (userFilteringProfileId = profile.id)}
							/>
						{/if}
					</div>
					<div class="max-h-[calc(100%-2rem)] scrollbar-thumb-zinc-600 overflow-y-auto">
						<p class="mt-1.5 flex flex-wrap gap-1 border-t pt-1 text-zinc-500">
							{$_('settings.filtering.qualities')}:&nbsp;
							{#each profile.qualities as quality (quality)}
								<span class="rounded-2xl bg-purple-400 px-2 py-1 text-xs text-black"
									>{quality}</span
								>
							{/each}
						</p>
					</div>
				</div>
			</button>
		{/each}
		{#if !globalSettings}
			<input
				type="hidden"
				name={saveSettings.fields.userFilteringProfileId.as('number').name}
				value={userFilteringProfileId}
			/>
		{/if}
	</div>
</div>
