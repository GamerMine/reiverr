<script lang="ts">
	import { page } from '$app/state';
	import I18n from '$lib/components/common/I18n.svelte';
	import DynamicModal from '$lib/components/common/modal/DynamicModal.svelte';
	import Navbar from '$lib/components/page/default/navbar/Navbar.svelte';
	import UpdateChecker from '$lib/components/page/default/UpdateChecker.svelte';
	import '../app.css';
	import type { LayoutServerData } from './$types';
	import Notifications from '$lib/components/common/misc/notification/Notifications.svelte';
	import type { Snippet } from 'svelte';
	import { settings } from '$lib/stores/settings.svelte';

	let { data, children }: { data: LayoutServerData; children: Snippet } = $props();
	settings.userSettings = data.settings.userSettings;
	settings.globalSettings = data.settings.globalSettings;
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
</div>
