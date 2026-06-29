<script lang="ts">
	import { fade } from 'svelte/transition';
	import UserImage from '$lib/components/images/UserImage.svelte';
	import Divider from '$lib/components/layout/Divider.svelte';
	import Button from '$lib/components/controls/Button.svelte';
	import { Exit, Gear } from 'svelte-radix';
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import { jellyfinDisconnect } from '$lib/remote/jellyfin.remote.js';
	import type { JellyfinUserDto } from '@reiverr/connectors/types/radarr';

	let {
		onclick = () => {}
	}: {
		onclick?: () => void;
	} = $props();

	let user: JellyfinUserDto = JSON.parse(localStorage.getItem('user') || '{}') || undefined;
</script>

<div class="fixed z-20 flex justify-end top-20 right-3" transition:fade={{ duration: 150 }}>
	<div class="bg-stone-900 rounded-xl shadow-lg max-w-60 w-full">
		<div class="flex m-4">
			<UserImage {user} size={11} textSize="text-2xl" />
			<div class="ml-4 w-36">
				<p class="truncate">{user.Name}</p>
				<p class="text-zinc-700 text-sm truncate">
					{user.Policy?.IsAdministrator
						? $_('navbar.userMenu.administrator')
						: $_('navbar.userMenu.user')}
				</p>
			</div>
		</div>
		<Divider />
		<div class="mx-2 my-2">
			<Button
				variant="tertiary"
				class="w-full"
				onclick={async () => {
					onclick();
					await goto('/settings');
				}}
			>
				<Gear size="20"></Gear><span class="flex ml-2"
					>{$_('navbar.userMenu.settings')}</span
				>
			</Button>
		</div>
		<Divider />
		<div class="mx-2 my-2">
			<Button
				variant="tertiary"
				class="w-full"
				onclick={async () => {
					onclick();
					await jellyfinDisconnect();
					await goto('/login');
				}}
			>
				<Exit size="20"></Exit><span class="flex ml-2">{$_('navbar.userMenu.logout')}</span>
			</Button>
		</div>
	</div>
</div>
