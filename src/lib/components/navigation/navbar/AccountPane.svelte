<script lang="ts">
	import { slide } from 'svelte/transition';
	import AccountIImage from '#lib/components/images/AccountIImage.svelte';
	import Divider from '#lib/components/layout/Divider.svelte';
	import Button from '#lib/components/controls/Button.svelte';
	import { ActivityLog, Exit, Gear } from 'svelte-radix';
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import type { JellyfinUserDto } from '@unifarr/connectors/types/jellyfin';
	import { logout } from '#lib/remote/login.remote.ts';

	let {
		onclick = () => {}
	}: {
		onclick?: (menu?: 'notifications' | undefined) => void;
	} = $props();

	let user: JellyfinUserDto = JSON.parse(localStorage.getItem('user') || '{}') || undefined;
</script>

<div class="fixed top-20 right-3 z-20 flex justify-end" transition:slide={{ duration: 500 }}>
	<div class="w-full max-w-60 rounded-xl bg-neutral-800 shadow-lg">
		<div class="m-4 flex">
			<AccountIImage {user} size={11} textSize="text-2xl" />
			<div class="ml-4 w-36">
				<p class="truncate">{user.Name}</p>
				<p class="truncate text-sm text-zinc-600">
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
				<Gear size="20"></Gear><span class="ml-2 flex"
					>{$_('navbar.userMenu.settings')}</span
				>
			</Button>
			<Button
				variant="tertiary"
				class="mt-1 w-full"
				onclick={async () => {
					onclick('notifications');
				}}
			>
				<ActivityLog size="20"></ActivityLog><span class="ml-2 flex"
					>{$_('navbar.userMenu.notifications')}</span
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
					await logout();
					await goto('/auth/login?logout');
				}}
			>
				<Exit size="20"></Exit><span class="ml-2 flex">{$_('navbar.userMenu.logout')}</span>
			</Button>
		</div>
	</div>
</div>
