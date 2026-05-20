<script lang="ts">
    import ModalHeader from "$lib/components/common/modal/ModalHeader.svelte";
    import { _ } from 'svelte-i18n';
    import {modalStack} from "$lib/stores/modal.store";
    import Select from "$lib/components/common/inputs/forms/Select.svelte";
    import {LANGUAGES, QUALITY_DEFS} from "$lib/constants";
    import Input from "$lib/components/common/inputs/forms/Input.svelte";
    import ModalContainer from "$lib/components/common/modal/ModalContainer.svelte";
    import { Plus } from "svelte-radix";
    import FormButton from "$lib/components/common/inputs/forms/FormButton.svelte";
    import { enhance } from '$app/forms';
    import {createErrorNotification, createSuccessNotification} from "$lib/stores/notification.store";
    import {invalidateAll} from "$app/navigation";
    import Option from "$lib/components/common/inputs/forms/Option.svelte";
    import type {FilteringProfile} from "$lib/entities/Types";
    import {onMount} from "svelte";
    import type {SelectOption} from "$lib/types";

    let {
        modalId,
        editProfile
    }: {
        modalId: symbol;
        editProfile?: FilteringProfile;
    } = $props();

    let disableInputs = $state(false);
    let nameValue = $state("");
    let languageValue: SelectOption[] = $state([]);
    let qualitiesValue: SelectOption[] = $state([]);

    function userClose() {
        modalStack.close(modalId);
    }

    onMount(() => {
        if (editProfile) {
            nameValue = editProfile.name;
            languageValue = [{
                value: editProfile.language,
                label: $_("languages."+editProfile.language)
            }];
            for (const val of editProfile.qualities) {
                qualitiesValue.push({
                    value: val,
                    label: val
                });
            }
        }
    })
</script>

<ModalContainer>
    <ModalHeader
            close={userClose}
            text={$_("settings.filtering.addProfile")}
    />
    <form class="grid grid-cols-2 p-4 gap-2" method="POST" action="?/createFilteringProfile" use:enhance={() => {
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
        <Select name="language" disabled={disableInputs} value={languageValue}>
            <Option value="any" label={$_('languages.any')} />
            {#each LANGUAGES as lang}
                <Option value={lang} label={$_("languages."+lang)}/>
            {/each}
        </Select>
        <h2>
            {$_('settings.filtering.qualities')}
        </h2>
        <Select name="qualities" disabled={disableInputs} multiple value={qualitiesValue}>
            {#each QUALITY_DEFS as quality}
                <Option value={quality} label={quality} />
            {/each}
        </Select>
        <div class="col-start-2 flex justify-end">
            <FormButton type="base" loading={disableInputs}>
                <Plus size="20"/><span class="flex">{$_('settings.filtering.add')}</span>
            </FormButton>
        </div>
    </form>
</ModalContainer>