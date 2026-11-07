<script lang="ts">
	import type { PageData } from '../../../../../.svelte-kit/types/src/routes';
	import PersonPage from '#lib/components/pages/PersonPage.svelte';

	let { data }: { data: PageData } = $props();

	let personId: number = $state(0);
	$effect(() => {
		personId = Number(data.personId);
	});
</script>

{#key personId}
	<PersonPage tmdbId={personId} />
{/key}
