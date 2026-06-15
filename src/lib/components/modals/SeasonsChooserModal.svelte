<script lang="ts">
	import ModalContainer from '$lib/components/common/modal/ModalContainer.svelte';
	import ModalHeader from '$lib/components/common/modal/ModalHeader.svelte';
	import { _ } from 'svelte-i18n';
	import { modalStack } from '$lib/stores/modal.store';
	import Accordion from '$lib/components/common/misc/Accordion.svelte';
	import type { SeasonData } from '$lib/types';
	import Button from '$lib/components/common/inputs/buttons/Button.svelte';

	let {
		modalId,
		seasonsData,
		endChoice
	}: {
		modalId: symbol;
		seasonsData: Promise<SeasonData>[];
		endChoice: () => boolean | undefined;
	} = $props();

	function userClose() {
		modalStack.close(modalId);
		endChoice();
	}
</script>

<ModalContainer>
	<ModalHeader close={userClose} text={$_('ui.modal.seasonsChooser.title')} />
	<div class="m-2 space-y-2 max-h-150 overflow-auto">
		{#each seasonsData as seasonData (seasonData)}
			{#await seasonData}
				<Accordion loading={true} />
			{:then data}
				<Accordion>
					{#snippet summary()}
						<div class="flex">
							<p>{$_('library.content.season')} {data.season_number}</p>
							<p>{data.overview}</p>
						</div>
					{/snippet}
					{#snippet content()}
						<div class="space-y-2">
							{#each data.episodes as episode}
								<div class="flex">
									<img
										src={episode.backdropUrl}
										alt={episode.title}
										class="max-w-30"
									/>
									<p>{episode.title}</p>
								</div>
							{/each}
						</div>
					{/snippet}
				</Accordion>
			{/await}
		{/each}
	</div>
	<div class="flex justify-end mr-2 mb-2">
		<Button type="button" variant="primary">
			<span class="flex">OK</span>
		</Button>
	</div>
</ModalContainer>
