<script lang="ts">
	import { jellyfinGetUsers, type JellyfinUser } from '$lib/apis/jellyfin/jellyfinApi';
	import UserCarousel from '$lib/components/Carousel/UserCarousel.svelte';
	import UserCard from '$lib/components/Card/UserCard.svelte';
	import { _ } from 'svelte-i18n';
	import Button from '$lib/components/Button.svelte';
	import { Keyboard, Enter, Update } from 'svelte-radix';
	import Input from '$lib/components/forms/Input.svelte';
	import { ChevronLeft } from 'svelte-radix';
	import { enhance } from '$app/forms';
	import { createErrorNotification } from '$lib/stores/notification.store';

	let userSelected: boolean = $state(false);
	let selectedUser: JellyfinUser | undefined = $state();
	let isInputDisabled: boolean = $state(false);
	let errorMessage: string | undefined = $state();

	function askForPassword(user: JellyfinUser) {
		userSelected = true;
		selectedUser = user;
	}

	$effect(() => {
		if (errorMessage) {
			createErrorNotification(errorMessage, errorMessage);
		}
	});
</script>

<div class="overflow-hidden">
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
			<div class="absolute items-center top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2">
				<UserCarousel
					klass="transition duration-300 ease-in-out {userSelected
						? 'invisible opacity-0 -translate-y-30'
						: 'visible'}"
				>
					{#each users as user}
						<UserCard {user} onclick={() => askForPassword(user)}></UserCard>
					{/each}
				</UserCarousel>
			</div>
			<div
				class="flex justify-center pt-100 transition duration-300 ease-in-out {userSelected
					? 'opacity-0 invisible'
					: ''}"
			>
				<Button type="tertiary">
					<span class="mr-1">{$_('login.manualLogin')}</span><Keyboard size="20" />
				</Button>
			</div>
		</div>

		<div>
			<button
				class="absolute items-center left-1/2 -translate-x-35 -translate-y-95 transition duration-300 ease-in-out {userSelected
					? 'visible opacity-100'
					: 'opacity-0 invisible'}"
				disabled={isInputDisabled}
				onclick={() => {
					userSelected = false;
					selectedUser = undefined;
				}}><span class="flex"><ChevronLeft />{$_('login.goBack')}</span></button
			>
			<UserCard
				user={selectedUser}
				clickable={false}
				klass="absolute items-center left-1/2 -translate-x-1/2 transition delay-50 duration-300 ease-in-out {userSelected
					? 'visible opacity-100 -translate-y-80'
					: 'opacity-0 translate-y-30 invisible'}"
			></UserCard>
			<form
				method="POST"
				use:enhance={({ formData }) => {
					isInputDisabled = true;
					formData.append('username', selectedUser?.Name || '');
					return async ({ result, update }) => {
						await update();
						if (result.type !== 'success') {
							isInputDisabled = false;
							if (result.data?.code === 1) {
								errorMessage = $_('login.invalidCredential');
							} else {
								errorMessage = $_('login.unknownError');
							}
						} else {
							window.location.href = '/';
						}
					};
				}}
			>
				<Input
					placeholder={$_('login.password')}
					type="password"
					name="password"
					disabled={isInputDisabled}
					klass="absolute items-center left-1/2 -translate-x-1/2 transition duration-300 ease-in-out {userSelected
						? 'visible opacity-90 -translate-y-35'
						: 'opacity-0 translate-y-30 invisible'} {errorMessage ? 'bg-red-500/20!' : ''}"
					onchange={() => {
						if (errorMessage) {
							errorMessage = undefined;
						}
					}}
				></Input>
				<div
					class="absolute items-center left-1/2 -translate-x-1/2 transition duration-300 ease-in-out {userSelected
						? 'visible opacity-90 -translate-y-25'
						: 'opacity-0 translate-y-30 invisible'}"
				>
					<Button type="secondary" disabled={isInputDisabled}>
						<span class="mr-1">{$_('login.logIn')}</span>
						{#if isInputDisabled}
							<Update class="animate-spin" size="20" />
						{:else}
							<Enter size="20" />
						{/if}
					</Button>
				</div>
			</form>
		</div>
	{/await}
</div>
