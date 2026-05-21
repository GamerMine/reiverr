<script lang="ts">
    import ModalHeader from "$lib/components/common/modal/ModalHeader.svelte";
    import { _ } from 'svelte-i18n';
    import {modalStack} from "$lib/stores/modal.store";
    import Select from "$lib/components/common/inputs/forms/Select.svelte";
    import {LANGUAGES, QUALITY_DEFS} from "$lib/constants";
    import Input from "$lib/components/common/inputs/forms/Input.svelte";
    import ModalContainer from "$lib/components/common/modal/ModalContainer.svelte";
    import { Plus, Pencil2 } from "svelte-radix";
    import FormButton from "$lib/components/common/inputs/forms/FormButton.svelte";
    import { enhance } from '$app/forms';
    import {createErrorNotification, createSuccessNotification} from "$lib/stores/notification.store";
    import {invalidateAll} from "$app/navigation";
    import Option from "$lib/components/common/inputs/forms/Option.svelte";
    import type {FilteringProfile} from "$lib/entities/Types";
    import type {SelectOption} from "$lib/types";
    import {SvelteSet} from "svelte/reactivity";

    let {
        modalId,
        editProfile
    }: {
        modalId: symbol;
        editProfile?: FilteringProfile;
    } = $props();

    let disableInputs = $state(false);
    let nameValue = $state("");
    let languageValue = $state(new SvelteSet<SelectOption>());
    let qualitiesValue = $state(new SvelteSet<SelectOption>());

    function userClose() {
        modalStack.close(modalId);
    }

    // This has been done to prevent showing the 'state_referenced_locally' warning.
    (() => {
        if (editProfile) {
            nameValue = editProfile.name;
            languageValue.add({
                value: editProfile.language,
                label: $_("languages." + editProfile.language)
            });
            for (const val of editProfile.qualities) {
                qualitiesValue.add({
                    value: val,
                    label: val
                });
            }
        }
    })();

</script>

<ModalContainer>
    <ModalHeader
            close={userClose}
            text={editProfile ? $_("settings.filtering.editProfile") : $_("settings.filtering.addProfile")}
    />
    <form class="grid grid-cols-2 p-4 gap-2" method="POST" action={editProfile ? "?/editFilteringProfile" : "?/createFilteringProfile"} use:enhance={() => {
        disableInputs = true;
        return async ({result}) => {
            if (result.type === 'success') {
                modalStack.close(modalId);
                await invalidateAll();
                createSuccessNotification($_("general.success"), $_("settings.filtering.filteringProfileCreatedSuccess"))
            } else {
                createErrorNotification("ERROR", "TODO") // TODO: Add reasons
            }
            disableInputs = false;
        }
    }}>
        <h2>
            {$_('settings.filtering.profileName')}
        </h2>
        <Input name="profileName" type="text" required disabled={disableInputs} value={nameValue} />
        <h2>
            {$_('settings.filtering.language')}
        </h2>
        <Select name="language" disabled={disableInputs} selectedValues={languageValue}>
            {#each LANGUAGES as lang}
                <Option value={lang} label={$_("languages."+lang)}/>
            {/each}
        </Select>
        <h2>
            {$_('settings.filtering.qualities')}
        </h2>
        <Select name="qualities" disabled={disableInputs} multiple selectedValues={qualitiesValue}>
            {#each QUALITY_DEFS as quality}
                <Option value={quality} label={quality} />
            {/each}
        </Select>
        <div class="col-start-2 flex justify-end">
            {#if editProfile}
                <input type="hidden" name="profileId" value={editProfile.id} />
                <FormButton type="base" loading={disableInputs}>
                    <Pencil2 size="20"/><span class="flex">{$_('general.edit')}</span>
                </FormButton>
            {:else}
                <FormButton type="base" loading={disableInputs}>
                    <Plus size="20"/><span class="flex">{$_('general.add')}</span>
                </FormButton>
            {/if}
        </div>
    </form>
</ModalContainer>