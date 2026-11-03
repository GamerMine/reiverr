<script lang="ts">
	import type { PageData } from './$types';
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
