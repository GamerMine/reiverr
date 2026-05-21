<script lang="ts">
	import { page } from '$app/state';
	import I18n from '$lib/components/common/I18n.svelte';
	import DynamicModal from '$lib/components/common/modal/DynamicModal.svelte';
	import Navbar from '$lib/components/page/default/navbar/Navbar.svelte';
	import UpdateChecker from '$lib/components/page/default/UpdateChecker.svelte';
	import '../app.css';
	import type { LayoutServerData } from './$types';
	import Notifications from '$lib/components/common/misc/notification/Notifications.svelte';
	import {type Snippet} from 'svelte';
	import { settings } from '$lib/stores/settings.svelte';
	import { CrossCircled } from 'svelte-radix';
	import { fade } from 'svelte/transition';
	import { _ } from 'svelte-i18n';

	let { data, children }: { data: LayoutServerData; children: Snippet } = $props();

	let criticalErrorMessage: string | undefined = $state();
	let showCriticalError: boolean = $state(false);

	// This has been done to prevent showing the 'state_referenced_locally' warning.
	(() => {
		if (data.settings) {
			settings.userSettings = data.settings.userSettings;
			settings.globalSettings = data.settings.globalSettings;
		} else {
			criticalErrorMessage = data.error;
			showCriticalError = true;
			setTimeout(() => {
				window.location.reload();
			}, 20000);
		}
	})()
</script>

<I18n />
<div class="app">
	{#if !['/login', '/setup'].includes(page.url.pathname)}
		<Navbar />
	{/if}
	<main>
		{@render children?.()}
	</main>
	{#key page.url.pathname}
		<DynamicModal />
	{/key}
	<Notifications />
	<UpdateChecker />
	{#if showCriticalError}
		<div
			class="fixed inset-0 backdrop-blur-3xl flex items-center justify-center z-50"
			transition:fade
		>
			<div class="bg-zinc-800/50 rounded-lg p-6 shadow-lg max-w-sm w-full text-center">
				<div class="grid grid-cols-3">
					<CrossCircled size="30" color="rgb(130 24 26)" />
					<h1 class="text-3xl text-red-900 font-bold mb-4">Error</h1>
				</div>
				{#if criticalErrorMessage}
					<p class="text-lg">{$_(criticalErrorMessage)}</p>
				{:else}
					<p class="text-lg"></p>
				{/if}
			</div>
		</div>
	{/if}
</div>
