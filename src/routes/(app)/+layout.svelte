<script lang="ts">
	import Navbar from '#lib/components/navigation/navbar/Navbar.svelte';
	import '../../app.css';
	import type { LayoutServerData } from './$types';
	import { onMount, type Snippet } from 'svelte';
	import { CrossCircled } from 'svelte-radix';
	import { fade } from 'svelte/transition';
	import { _ } from 'svelte-i18n';
	import OidcTokenRenewer from '#lib/components/navigation/OidcTokenRenewer.svelte';
	import { getUserSettings } from '#lib/remote/settings.remote.ts';

	let { data, children }: { data: LayoutServerData; children: Snippet } = $props();

	let criticalErrorMessage: string | undefined = $state();
	let showCriticalError: boolean = $state(false);

	// This has been done to prevent showing the 'state_referenced_locally' warning.
	onMount(() => {
		getUserSettings().refresh()
	})
</script>

<Navbar />
{#if data.isOidc}
	<OidcTokenRenewer />
{/if}
<main>
	{@render children?.()}
</main>
{#if showCriticalError}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-3xl"
		transition:fade
	>
		<div class="w-full max-w-sm rounded-lg bg-zinc-800/50 p-6 text-center shadow-lg">
			<div class="grid grid-cols-3">
				<CrossCircled size="30" color="rgb(130 24 26)" />
				<h1 class="mb-4 text-3xl font-bold text-red-900">Error</h1>
			</div>
			{#if criticalErrorMessage}
				<p class="text-lg">{$_(criticalErrorMessage)}</p>
			{:else}
				<p class="text-lg"></p>
			{/if}
		</div>
	</div>
{/if}
