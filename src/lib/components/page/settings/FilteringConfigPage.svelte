<script lang="ts">
	import classNames from 'classnames';
	import { _ } from 'svelte-i18n';
	import Toggle from '$lib/components/common/inputs/forms/Toggle.svelte';
	import { Plus, StarFilled, Star, Trash } from 'svelte-radix';
	import { modalStack } from '$lib/stores/modal.store';
	import FilteringProfileModal from '$lib/components/modals/FilteringProfileModal.svelte';
	import type { FilteringProfile, GlobalSettings } from '@reiverr/db/types';
	import { deleteFilteringProfile, saveSettings } from '$lib/remote/settings.remote';
	import { invalidateAll } from '$app/navigation';
	import { createSuccessNotification } from '$lib/stores/notification.store';
	import { LANGUAGES } from '$lib/constants';
	import Select from '$lib/components/common/inputs/forms/Select.svelte';
	import Option from '$lib/components/common/inputs/forms/Option.svelte';

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
		await invalidateAll();
		if (res.success) {
			createSuccessNotification(
				$_('general.success'),
				$_('settings.filtering.filteringProfileDeleteSuccess')
			);
		}
	}

	$effect(() => {
		if (!globalSettings) {
			if (userFilteringProfileId) {
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
		class="border-b border-zinc-800 pb-4 mt-8 col-span-2 justify-self-stretch flex flex-col gap-2"
	>
		<h1 class="font-medium text-2xl text-zinc-200 tracking-wide">
			{$_('settings.filtering.filteringProfiles')}
		</h1>
		{#if !globalSettings}
			<p class="text-sm text-zinc-500 mt-1">
				{$_('settings.filtering.filteringProfilesDescription')}
			</p>
		{/if}
	</div>
	{#if globalSettings}
		<div>
			<h2>
				{$_('settings.filtering.letUserChoose')}
			</h2>
			<p class="text-sm text-zinc-500 mt-1">
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

	<div class="flex flex-wrap gap-2 my-8 col-span-2">
		{#if globalSettings}
			<button
				class="bg-neutral-900 rounded-md h-50 w-80 flex justify-center items-center hover:cursor-pointer hover:bg-neutral-800 transition-colors duration-200"
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
					'bg-neutral-900 rounded-md h-50 w-80 flex hover:bg-neutral-800 transition-colors duration-200 overflow-hidden',
					{ 'hover:cursor-default': !globalSettings }
				)}
				onclick={(e) => {
					if (globalSettings) {
						editProfile(e, profile);
					} else e.preventDefault();
				}}
			>
				<div class="p-4 w-full">
					<div class="flex justify-between">
						<p class="text-xl font-bold text-start flex items-center">
							{profile.name}&nbsp<span class={isDefault ? 'visible' : 'hidden'}
								><StarFilled /></span
							>
						</p>
						{#if globalSettings}
							<Trash
								class="bg-red-700 p-1 rounded-md hover:bg-red-900 transition-colors duration-100"
								size="30"
								onclick={(e) => deleteProfile(e, profile)}
							/>
						{:else}
							<Star
								color="black"
								class={classNames(
									'bg-white p-1 rounded-md hover:bg-neutral-300 hover:cursor-pointer transition-colors duration-200',
									{ visible: !isDefault, hidden: isDefault }
								)}
								size="30"
								onclick={() => (userFilteringProfileId = profile.id)}
							/>
						{/if}
					</div>
					<div class="overflow-y-auto max-h-[calc(100%-2rem)] scrollbar-thumb-zinc-600">
						<p class="text-zinc-500 flex flex-wrap gap-1 border-t mt-1.5 pt-1">
							{$_('settings.filtering.qualities')}:&nbsp;
							{#each profile.qualities as quality (quality)}
								<span class="bg-amber-300 px-2 py-1 rounded-2xl text-xs text-black"
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
