<script lang="ts">
	import { version } from '$app/environment';
	import { createLocalStorageStore } from '$lib/stores/localstorage.store';
	import { Cross2 } from 'radix-icons-svelte';
	import IconButton from './IconButton.svelte';
	import axios from 'axios';
	import Button from './Button.svelte';
	import { _ } from 'svelte-i18n';

	let visible = true;

	const skippedVersion = createLocalStorageStore<string>('skipped-version', '');

	async function fetchLatestVersion() {
		return axios
			.get('https://api.github.com/repos/GamerMine/reiverr/tags')
			.then((res) => res.data?.find((v: { name: string }) => v.name.startsWith('v1'))?.name);
	}

	function checkVersionLatest(latestVersion: string) {
		let latestMinor: number = +latestVersion.split('.')[1];
		let latestBug: number = +latestVersion.split('.')[2];
		let currentMinor: number = +`v${version}`.split('.')[1];
		let currentBug: number = +`v${version}`.split('.')[2];

		if (latestVersion === `v${version}`) return true;
		if (latestVersion === $skippedVersion) return true;
		if (latestMinor > currentMinor) {
			return false;
		} else if (latestBug > currentBug && latestMinor == currentMinor) return false;
	}
</script>

{#await fetchLatestVersion() then latestVersion}
	{#if checkVersionLatest(latestVersion) && visible}
		<div
			class="fixed inset-x-0 bottom-0 p-3 flex items-center justify-center z-20 bg-stone-800 text-sm"
		>
			<a href="https://github.com/GamerMine/reiverr"
				>{latestVersion} {$_('update.updateAvailable')}</a
			>
			<div class="absolute right-4 inset-y-0 flex items-center gap-2">
				<Button type="tertiary" size="xs" onclick={() => skippedVersion.set(latestVersion)}>
					{$_('update.skipVersion')}
				</Button>
				<IconButton onclick={() => (visible = false)}>
					<Cross2 size={20} />
				</IconButton>
			</div>
		</div>
	{/if}
{/await}
