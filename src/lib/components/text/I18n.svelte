<script lang="ts">
	import { addMessages, init, locale } from 'svelte-i18n';
	import en from '../../lang/en.json';
	import fr from '../../lang/fr.json';
	import { settings } from '$lib/stores/settings.svelte.js';

	addMessages('en', en);
	addMessages('fr', fr);

	init({
		fallbackLocale: 'en'
	});

	$effect(() => {
		locale.set(settings.userSettings.interface.language);
	});
</script>
