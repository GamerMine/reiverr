<script lang="ts">
	import ModalContainer from '#lib/components/modals/ModalContainer.svelte';
	import ModalHeader from '#lib/components/modals/ModalHeader.svelte';
	import { _ } from 'svelte-i18n';
	import { modalStack } from '#lib/stores/modal.store.js';
	import Accordion from '#lib/components/controls/Accordion.svelte';
	import type {
		EpisodeDataWithCheck,
		SeasonData,
		SeasonDataWithCheck
	} from '#lib/utils/types.js';
	import Button from '#lib/components/controls/Button.svelte';
	import TruncatedText from '#lib/components/text/TruncatedText.svelte';
	import Toggle from '#lib/components/controls/Toggle.svelte';
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
	<div class="m-2 max-h-150 space-y-2 overflow-auto">
		{#if loading || !seasonsData}
			<Accordion loading={true} />
		{:else}
			{#each seasonsData as data, si (data.seasonNumber)}
				<Accordion>
					{#snippet summary()}
						<div class="mx-2 flex flex-1 justify-between">
							<p class="flex items-center font-bold">
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
						<div class="max-h-110 space-y-2 overflow-auto">
							{#each data.episodes as episode, ei (episode.episodeNumber)}
								<div class="flex rounded-md bg-zinc-600">
									<img
										src={episode.backdropUrl}
										alt={episode.title}
										class="max-w-35 rounded-tl-md"
									/>
									<div
										class="mx-2 grid grid-flow-col grid-cols-3 place-content-center space-x-1"
									>
										<p class="col-span-1 flex items-center text-sm font-bold">
											{episode.title}
										</p>
										<TruncatedText
											class="col-span-3 p-2 text-sm"
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
	<div class="mr-2 mb-2 flex justify-end">
		<Button type="button" variant="primary" onclick={confirm}>
			<span class="flex">OK</span>
		</Button>
	</div>
</ModalContainer>
