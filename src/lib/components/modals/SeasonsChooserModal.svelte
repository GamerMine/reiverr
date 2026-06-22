<script lang="ts">
	import ModalContainer from '$lib/components/common/modal/ModalContainer.svelte';
	import ModalHeader from '$lib/components/common/modal/ModalHeader.svelte';
	import { _ } from 'svelte-i18n';
	import { modalStack } from '$lib/stores/modal.store';
	import Accordion from '$lib/components/common/misc/Accordion.svelte';
	import type { EpisodeDataWithCheck, SeasonData, SeasonDataWithCheck } from '$lib/types';
	import Button from '$lib/components/common/inputs/buttons/Button.svelte';
	import TruncatedText from '$lib/components/common/text/TruncatedText.svelte';
	import Toggle from '$lib/components/common/inputs/forms/Toggle.svelte';
	import { onMount } from 'svelte';

	let {
		modalId,
		seasonsDataPromise,
		endChoice
	}: {
		modalId: symbol;
		seasonsDataPromise: Promise<SeasonData>[];
		endChoice: (res: SeasonDataWithCheck[] | undefined) => void;
	} = $props();

	let loading = $state(true);
	let seasonsData: SeasonDataWithCheck[] = $state([]);

	function userClose() {
		modalStack.close(modalId);
		endChoice(undefined);
	}

	function confirm() {
		modalStack.close(modalId);
		endChoice($state.snapshot(seasonsData));
	}

	function seasonToggle(seasonNumber: number, checked: boolean) {
		for (const season of seasonsData) {
			if (season.seasonNumber === seasonNumber) {
				season.episodes.forEach((e: EpisodeDataWithCheck) => {
					e.checked = checked;
				});
				break;
			}
		}
	}

	function episodeToggle(seasonNumber: number, checked: boolean) {
		for (const season of seasonsData) {
			if (season.seasonNumber === seasonNumber) {
				if (!checked) season.checked = false;
				else if (!season.episodes.find((e: EpisodeDataWithCheck) => !e.checked))
					season.checked = true;
				break;
			}
		}
	}

	onMount(async () => {
		const rawSeasonsData = await Promise.all(seasonsDataPromise);
		seasonsData = rawSeasonsData.map((rs) => ({
			...rs,
			checked: true,
			episodes: rs.episodes.map((e) => ({ ...e, checked: true }))
		}));
		loading = false;
	});
</script>

<ModalContainer>
	<ModalHeader close={userClose} text={$_('ui.modal.seasonsChooser.title')} />
	<div class="m-2 space-y-2 max-h-150 overflow-auto">
		{#if loading || !seasonsData}
			<Accordion loading={true} />
		{:else}
			{#each seasonsData as data, si (data.seasonNumber)}
				<Accordion>
					{#snippet summary()}
						<div class="flex flex-1 justify-between mx-2">
							<p class="font-bold flex items-center">
								{$_('library.content.season')}
								{data.seasonNumber}
							</p>
							<Toggle
								class="flex items-center"
								bind:checked={seasonsData[si].checked}
								onchange={(v) => seasonToggle(data.seasonNumber, v)}
							/>
						</div>
					{/snippet}
					{#snippet content()}
						<div class="space-y-2 overflow-auto max-h-110">
							{#each data.episodes as episode, ei (episode.episodeNumber)}
								<div class="flex bg-zinc-600 rounded-md">
									<img
										src={episode.backdropUrl}
										alt={episode.title}
										class="max-w-35 rounded-tl-md"
									/>
									<div
										class="grid grid-flow-col grid-cols-3 place-content-center space-x-1 mx-2"
									>
										<p class="col-span-1 text-sm font-bold flex items-center">
											{episode.title}
										</p>
										<TruncatedText
											class="text-sm col-span-3 p-2"
											text={episode.overview}
											maxLength={120}
										/>
										<Toggle
											class="col-span-1 flex items-center justify-center"
											bind:checked={seasonsData[si].episodes[ei].checked}
											onchange={(v) => episodeToggle(data.seasonNumber, v)}
										/>
									</div>
								</div>
							{/each}
						</div>
					{/snippet}
				</Accordion>
			{/each}
		{/if}
	</div>
	<div class="flex justify-end mr-2 mb-2">
		<Button type="button" variant="primary" onclick={confirm}>
			<span class="flex">OK</span>
		</Button>
	</div>
</ModalContainer>
