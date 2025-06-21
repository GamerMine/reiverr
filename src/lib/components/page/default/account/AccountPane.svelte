<script lang="ts">
	import { fade } from 'svelte/transition';
	import UserImage from '$lib/components/common/images/UserImage.svelte';
	import Divider from '$lib/components/common/misc/Divider.svelte';
	import Button from '$lib/components/common/inputs/buttons/Button.svelte';
	import { Exit } from 'svelte-radix';
	import { jellyfinDisconnectUser, type JellyfinUser } from '$lib/apis/jellyfin/jellyfinApi';

	let user: JellyfinUser = JSON.parse(localStorage.getItem('user') || '{}') || undefined;
</script>

<div class="fixed z-20 flex justify-end top-20 right-3" transition:fade={{ duration: 150 }}>
	<div class="bg-stone-900 rounded-xl shadow-lg max-w-60 w-full">
		<div class="flex m-4">
			<UserImage {user} size={11} textSize="text-2xl" />
			<div class="ml-4 w-36">
				<p class="truncate">{user.Name}</p>
				<p class="text-zinc-700 text-sm truncate">
					{user.Policy?.IsAdministrator ? 'Administrator' : 'User'}
				</p>
			</div>
		</div>
		<Divider />
		<div class="mx-2 my-2">
			<Button
				variant="tertiary"
				klass="w-full"
				onclick={() => (window.location.href = '/settings')}
			>
				<Exit size="20"></Exit><span class="flex">Settings</span>
			</Button>
		</div>
		<Divider />
		<div class="mx-2 my-2">
			<Button
				variant="tertiary"
				klass="w-full"
				onclick={() => {
					jellyfinDisconnectUser();
					window.location.href = '/login';
				}}
			>
				<Exit size="20"></Exit><span class="flex">Logout</span>
			</Button>
		</div>
	</div>
</div>
