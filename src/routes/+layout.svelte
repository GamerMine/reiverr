<script lang="ts">
	import { page } from '$app/state';
	import I18n from '$lib/components/Lang/I18n.svelte';
	import DynamicModal from '$lib/components/Modal/DynamicModal.svelte';
	import Navbar from '$lib/components/Navbar/Navbar.svelte';
	import UpdateChecker from '$lib/components/UpdateChecker.svelte';
	import { settings } from '$lib/stores/settings.store';
	import '../app.css';
	import type { LayoutServerData } from './$types';
	import Notifications from '$lib/components/Notification/Notifications.svelte';
	import type { Snippet } from 'svelte';

	let { data, children }: { data: LayoutServerData; children: Snippet } = $props();
	settings.set(data.settings);
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
