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
    import {createErrorNotification} from "$lib/stores/notification.store";
    import {invalidateAll} from "$app/navigation";

    let {
        modalId
    }: {
        modalId: symbol;
    } = $props();

    let disableInputs = $state(false);

    function userClose() {
        modalStack.close(modalId);
    }
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
            } else {
                createErrorNotification("ERROR", "TODO") // TODO: Add reasons
            }
            disableInputs = false;
        }
    }}>
        <h2>
            {$_('settings.filtering.profileName')}
        </h2>
        <Input name="profileName" type="text" required disabled={disableInputs}/>
        <h2>
            {$_('settings.filtering.language')}
        </h2>
        <Select name="language" disabled={disableInputs}>
            <option value="any"> {$_('languages.any')} </option>
            {#each LANGUAGES as lang}
                <option value={lang}>{$_("languages."+lang)}</option>
            {/each}
        </Select>
        <h2>
            {$_('settings.filtering.qualities')}
        </h2>
        <Select name="qualities" disabled={disableInputs}>
            <option value="any"> {$_('languages.any')} </option>
            {#each QUALITY_DEFS as quality}
                <option value={quality}>{quality}</option>
            {/each}
        </Select>
        <div class="col-start-2 flex justify-end">
            <FormButton type="base" loading={disableInputs}>
                <Plus size="20"/><span class="flex">{$_('settings.filtering.add')}</span>
            </FormButton>
        </div>
    </form>
</ModalContainer>