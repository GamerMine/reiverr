<script lang="ts">
	import { jellyfinGetUsers } from '$lib/apis/jellyfin/jellyfinApi';
	import UserCarousel from '$lib/components/Carousel/UserCarousel.svelte';
	import UserCard from '$lib/components/Card/UserCard.svelte';
	import { _ } from 'svelte-i18n';
	import Button from '$lib/components/Button.svelte';
	import { Keyboard } from 'svelte-radix';

	function askForPassword(username: string) {
		console.log(username);
	}
</script>

<div>
	{#await jellyfinGetUsers()}
		<div>NON</div>
		<!-- TODO: If the Jellyfin instance is unreachable, show it to the user, add a timeout ? -->
	{:then users}
		<div>
			<div class="flex gap-2 rounded-xs items-center justify-center pt-20">
				<div class="rounded-full bg-amber-300 h-11 w-11"></div>
				<h1 class="font-display uppercase font-semibold tracking-wider text-5xl">Reiverr</h1>
			</div>
			<h1
				class="flex font-display font-semibold text-4xl items-center justify-center pt-10 w-screen"
			>
				{$_('login.whoWatching')}
			</h1>
			<UserCarousel klass="absolute w-full items-center top-1/2 -translate-y-1/2">
				{#each users as user}
					<UserCard {user} onclick={() => askForPassword(user.Name ?? '')}></UserCard>
				{/each}
			</UserCarousel>
			<div class="flex justify-center pt-100">
				<Button type="tertiary">
					<span class="mr-1">{$_('login.manualLogin')}</span><Keyboard size="20" />
				</Button>
			</div>
		</div>
	{/await}
</div>
