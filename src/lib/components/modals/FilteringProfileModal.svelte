<script lang="ts">
	import ModalHeader from '$lib/components/common/modal/ModalHeader.svelte';
	import { _ } from 'svelte-i18n';
	import { modalStack } from '$lib/stores/modal.store';
	import Select from '$lib/components/common/inputs/forms/Select.svelte';
	import { QUALITY_DEFS } from '$lib/constants';
	import Input from '$lib/components/common/inputs/forms/Input.svelte';
	import ModalContainer from '$lib/components/common/modal/ModalContainer.svelte';
	import { Plus, Pencil2 } from 'svelte-radix';
	import FormButton from '$lib/components/common/inputs/forms/FormButton.svelte';
	import {
		createErrorNotification,
		createSuccessNotification
	} from '$lib/stores/notification.store';
	import { invalidateAll } from '$app/navigation';
	import Option from '$lib/components/common/inputs/forms/Option.svelte';
	import type { FilteringProfile } from '@reiverr/db/types';
	import Toggle from '$lib/components/common/inputs/forms/Toggle.svelte';
	import { createUpdateFilteringProfile } from '$lib/remote/settings.remote';

	let {
		modalId,
		editProfile
	}: {
		modalId: symbol;
		editProfile?: FilteringProfile;
	} = $props();

	let disableInputs = $state(false);

	function userClose() {
		modalStack.close(modalId);
	}
</script>

<ModalContainer>
	<ModalHeader
		close={userClose}
		text={editProfile
			? $_('settings.filtering.editProfile')
			: $_('settings.filtering.addProfile')}
	/>
	<form
		{...createUpdateFilteringProfile.enhance(async (form) => {
			if (await form.submit()) {
				if (form.result?.success) {
					modalStack.close(modalId);
					await invalidateAll();
					createSuccessNotification(
						$_('general.success'),
						$_('settings.filtering.filteringProfileCreatedSuccess')
					);
				} else {
					createErrorNotification(
						$_('general.error'),
						$_(form.result?.error ?? 'general.unknownError')
					);
				}
				disableInputs = false;
			}
		})}
		class="grid grid-cols-2 p-4 gap-3 items-center"
		onsubmit={() => (disableInputs = true)}
	>
		<h2>
			{$_('settings.filtering.profileName')}
		</h2>
		<Input
			name={createUpdateFilteringProfile.fields.profileName.as('text').name}
			type="text"
			required
			value={editProfile?.name}
		/>
		<h2>
			{$_('settings.filtering.defaultProfile')}
		</h2>
		<Toggle
			name={createUpdateFilteringProfile.fields.isDefault.as('checkbox').name}
			checked={editProfile ? editProfile.isDefault : false}
		/>
		<h2>
			{$_('settings.filtering.qualities')}
		</h2>
		<Select
			name={createUpdateFilteringProfile.fields.qualities.as('select multiple').name}
			disabled={disableInputs}
			multiple
			selectedValues={editProfile ? editProfile.qualities : undefined}
		>
			{#each QUALITY_DEFS as quality (quality)}
				<Option value={quality} label={quality} />
			{/each}
		</Select>
		<div class="col-start-2 flex justify-end">
			{#if editProfile}
				<input
					name={createUpdateFilteringProfile.fields.profileId.as('number').name}
					type="hidden"
					value={editProfile.id}
				/>
				<FormButton
					{...createUpdateFilteringProfile.fields.action.as('submit', 'update')}
					type="base"
					loading={disableInputs}
				>
					<Pencil2 size="20" /><span class="flex">{$_('general.edit')}</span>
				</FormButton>
			{:else}
				<FormButton
					{...createUpdateFilteringProfile.fields.action.as('submit', 'create')}
					type="base"
					loading={disableInputs}
				>
					<Plus size="20" /><span class="flex">{$_('general.add')}</span>
				</FormButton>
			{/if}
		</div>
	</form>
</ModalContainer>
