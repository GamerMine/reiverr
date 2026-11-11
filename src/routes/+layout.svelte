<script lang="ts">
	import { page } from '$app/state';
	import I18n from '#lib/components/text/I18n.svelte';
	import DynamicModal from '#lib/components/modals/DynamicModal.svelte';
	import UpdateChecker from '#lib/components/layout/UpdateChecker.svelte';
	import '../app.css';
	import NotificationPane from '#lib/components/notification/NotificationPane.svelte';
	import { settings } from '#lib/stores/settings.svelte.ts';

	let { data, children } = $props();

	$effect.pre(() => {
		settings.globalSettings = data.settings.globalSettings;
		settings.userSettings = data.settings.userSettings;
	});
</script>

<I18n />
<div class="app">
	{@render children?.()}
	{#key page.url.pathname}
		<DynamicModal />
	{/key}
	<NotificationPane />
	<UpdateChecker />
</div>
