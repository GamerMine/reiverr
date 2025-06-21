<script lang="ts">
	import { addMessages, init, locale } from 'svelte-i18n';

	import de from '../../lang/de.json';
	import en from '../../lang/en.json';
	import es from '../../lang/es.json';
	import fr from '../../lang/fr.json';
	import it from '../../lang/it.json';
	import nl from '../../lang/nl.json';
	import pt_pt from '../../lang/pt-PT.json';
	import pt_br from '../../lang/pt-BR.json';
	import { settings } from '$lib/stores/settings.svelte.js';

	addMessages('de', de);
	addMessages('en', en);
	addMessages('es', es);
	addMessages('fr', fr);
	addMessages('it', it);
	addMessages('nl', nl);
	addMessages('pt-PT', pt_pt);
	addMessages('pt-BR', pt_br);

	init({
		fallbackLocale: 'en'
	});

	export function setTmpLanguage(language: string) {
		locale.set(language);
	}

	$effect(() => {
		locale.set(settings.userSettings.interface.language);
	});
</script>
