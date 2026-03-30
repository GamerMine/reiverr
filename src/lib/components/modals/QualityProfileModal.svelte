<script lang="ts">
    import ModalHeader from "$lib/components/common/modal/ModalHeader.svelte";
    import type {TitleType} from "$lib/types";
    import {getSonarrQualityProfiles} from "$lib/apis/sonarr/sonarrApi";
    import {getRadarrQualityProfiles} from "$lib/apis/radarr/radarrApi";
    import ModalContainer from "$lib/components/common/modal/ModalContainer.svelte";
    import modalStore from "$lib/stores/modal.store";

    let {
        modalId,
        groupId = undefined,

        type,
        selection
    }: {
        modalId: symbol;
        groupId?: symbol;

        type: TitleType;
        selection: (sel: number) => void;
    } = $props();
</script>

<ModalContainer>
    <ModalHeader
            back={groupId ? () => modalStore.close(modalId) : undefined}
            close={() => {groupId ? modalStore.closeGroup(groupId) : modalStore.close(modalId); selection(-1)}}
            text={"Choose Quality Profile"}/> <!-- TODO: Add translation -->
    {#await type === "movie" ? getRadarrQualityProfiles() : getSonarrQualityProfiles()}
        <div class="text-sm text-zinc-200 opacity-50 font-light p-4">Loading...</div>
    {:then qualityProfiles}
        <div class="flex flex-col divide-y divide-zinc-700 max-h-[60vh] overflow-y-scroll scrollbar-hide">
            {#each qualityProfiles as profile}
                <button
                        class="flex px-4 py-2 gap-4 hover:bg-lighten items-center justify-between cursor-pointer text-sm hover:bg-zinc-600"
                        onclick={() => {
                        selection(profile.id || -1);
                        groupId ? modalStore.closeGroup(groupId) : modalStore.close(modalId);
                    }}
                >
                    {profile.name}
                </button>
            {/each}
        </div>
    {/await}
</ModalContainer>