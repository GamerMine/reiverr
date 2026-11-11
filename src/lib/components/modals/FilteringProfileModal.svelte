<script lang="ts">
	import ModalHeader from '#lib/components/modals/ModalHeader.svelte';
	import { _ } from 'svelte-i18n';
	import { modalStack } from '#lib/stores/modal.store.js';
	import Select from '#lib/components/controls/Select.svelte';
	import { QUALITY_DEFS } from '#lib/utils/constants.js';
	import Input from '#lib/components/controls/Input.svelte';
	import ModalContainer from '#lib/components/modals/ModalContainer.svelte';
	import { Plus, Pencil2 } from 'svelte-radix';
	import Button from '#lib/components/controls/Button.svelte';
	import Option from '#lib/components/controls/Option.svelte';
	import type { FilteringProfile } from '@unifarr/db/types';
	import Toggle from '#lib/components/controls/Toggle.svelte';

	let {
		modalId,
		editProfile,
		onSave
	}: {
		modalId: symbol;
		editProfile?: FilteringProfile;
		// Nothing is sent to the server here: the profile is added to the settings draft
		// and only persisted when the user clicks "Save" on the settings page.
		onSave: (profile: FilteringProfile) => void;
	} = $props();

	let name = $state(editProfile?.name ?? '');
	let isDefault = $state(editProfile?.isDefault ?? false);
	let qualities: string[] = $state(editProfile ? [...editProfile.qualities] : []);

	function userClose() {
		modalStack.close(modalId);
	}

	function submit(e: SubmitEvent) {
		e.preventDefault();
		if (!name.trim()) return;
		onSave({
			id: editProfile?.id ?? -Date.now(),
			name: name.trim(),
			isDefault,
			qualities: qualities.filter((q) => QUALITY_DEFS.includes(q))
		});
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
	<form onsubmit={submit} class="grid grid-cols-2 items-center gap-3 p-4">
		<h2>
			{$_('settings.filtering.profileName')}
		</h2>
		<Input type="text" required bind:value={name} />
		<h2>
			{$_('settings.filtering.defaultProfile')}
		</h2>
		<Toggle bind:checked={isDefault} />
		<h2>
			{$_('settings.filtering.qualities')}
		</h2>
		<Select multiple bind:selectedValues={qualities}>
			{#each QUALITY_DEFS as quality (quality)}
				<Option value={quality} label={quality} />
			{/each}
		</Select>
		<div class="col-start-2 flex justify-end">
			<Button type="submit">
				{#if editProfile}
					<Pencil2 size="20" /><span class="flex">{$_('general.edit')}</span>
				{:else}
					<Plus size="20" /><span class="flex">{$_('general.add')}</span>
				{/if}
			</Button>
		</div>
	</form>
</ModalContainer>
