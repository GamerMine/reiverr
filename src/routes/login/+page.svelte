<script lang="ts">
	import UserCarousel from '$lib/components/common/misc/carousel/UserCarousel.svelte';
	import UserCard from '$lib/components/common/misc/cards/UserCard.svelte';
	import { _ } from 'svelte-i18n';
	import Button from '$lib/components/common/inputs/buttons/Button.svelte';
	import { Keyboard, Enter, Update } from 'svelte-radix';
	import Input from '$lib/components/common/inputs/forms/Input.svelte';
	import { ChevronLeft } from 'svelte-radix';
	import { createErrorNotification } from '$lib/stores/notification.store';
	import { onMount } from 'svelte';
	import { animateBackground } from '$lib/utils/animation';
	import { setTmpLanguage } from '$lib/utils';
	import { jellyfinGetUsers } from '$lib/remote/jellyfin.remote.ts';
	import { goto } from '$app/navigation';
	import { login } from '$lib/remote/login.remote.ts';
	import type { JellyfinUserDto } from '@reiverr/connectors/types/jellyfin';

	let mainDiv: HTMLDivElement | undefined = $state();
	let manualLogin: boolean = $state(false);
	let userSelected: boolean = $state(false);
	let selectedUser: JellyfinUserDto | undefined = $state();
	let isInputDisabled: boolean = $state(false);
	let errored: boolean = $state(false);

	function askForPassword(user: JellyfinUserDto) {
		userSelected = true;
		selectedUser = user;
		if (selectedUser?.Name) login.fields.username.set(selectedUser.Name);
	}

	$effect(() => {
		if (login.result) {
			if (login.result.success && login.result.data) {
				localStorage.setItem('user', JSON.stringify(login.result.data));
				goto('/');
			} else {
				errored = true;
				createErrorNotification(
					$_('general.error'),
					$_(login.result.error ?? 'general.unknownError')
				);
			}
			isInputDisabled = false;
		}
	});

	onMount(() => {
		if (mainDiv) {
			animateBackground(mainDiv);
			setTimeout(() => {
				if (mainDiv) {
					animateBackground(mainDiv);
				}
			}, 2000);
			setTimeout(() => {
				if (mainDiv) {
					animateBackground(mainDiv);
				}
			}, 5000);
		}
		setTmpLanguage(navigator.language);
	});
</script>

<div bind:this={mainDiv} class="relative overflow-hidden h-screen">
	{#await jellyfinGetUsers()}
		<div>NON</div>
		<!-- TODO: If the Jellyfin instance is unreachable, show it to the user, add a timeout ? -->
	{:then users}
		<div class="z-10">
			<div class="flex gap-2 rounded-xs items-center justify-center pt-20">
				<div class="rounded-full bg-amber-300 h-11 w-11"></div>
				<h1 class="font-display uppercase font-semibold tracking-wider text-5xl">
					Reiverr
				</h1>
			</div>
			<h1
				class="flex font-display font-semibold text-4xl items-center justify-center pt-10 w-screen"
			>
				{$_('login.whoWatching')}
			</h1>
			<div
				class="absolute items-center top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-full sm:w-1/2"
			>
				<UserCarousel
					klass="transition duration-300 ease-in-out {userSelected || manualLogin
						? 'invisible opacity-0 -translate-y-30'
						: 'visible'}"
				>
					{#each users.data as user (user)}
						<UserCard {user} onclick={() => askForPassword(user)}></UserCard>
					{/each}
				</UserCarousel>
			</div>
			<div
				class="flex justify-center pt-100 transition duration-300 ease-in-out {userSelected ||
				manualLogin
					? 'opacity-0 invisible'
					: ''}"
			>
				<Button
					variant="tertiary"
					onclick={() => {
						manualLogin = true;
					}}
				>
					<span class="mr-1">{$_('login.manualLogin')}</span><Keyboard size="20" />
				</Button>
			</div>
		</div>

		<div class="z-10">
			<button
				class="absolute items-center left-1/2 -translate-x-35 -translate-y-95 transition duration-300 ease-in-out {userSelected ||
				manualLogin
					? 'visible opacity-100'
					: 'opacity-0 invisible'}"
				disabled={isInputDisabled}
				onclick={() => {
					errored = false;
					userSelected = false;
					manualLogin = false;
					selectedUser = undefined;
				}}><span class="flex"><ChevronLeft />{$_('login.goBack')}</span></button
			>
			<UserCard
				user={selectedUser}
				clickable={false}
				klass="absolute items-center left-1/2 -translate-x-1/2 transition delay-50 duration-300 ease-in-out {userSelected ||
				manualLogin
					? 'visible opacity-100 -translate-y-80'
					: 'opacity-0 translate-y-30 invisible'}"
			></UserCard>
			<form
				{...login.enhance(async (form) => {
					isInputDisabled = true;
					await form.submit();
				})}
			>
				<Input
					placeholder={$_('login.username')}
					type="text"
					name={login.fields.username.as('text').name}
					disabled={isInputDisabled}
					klass="absolute items-center left-1/2 -translate-x-1/2 transition duration-300 ease-in-out {manualLogin
						? 'visible opacity-90 -translate-y-46'
						: 'opacity-0 translate-y-30 invisible'} {errored ? 'bg-red-500/20!' : ''}"
					onchange={() => (errored = false)}
					value={selectedUser?.Name || ''}
				></Input>
				<Input
					placeholder={$_('login.password')}
					type="password"
					name={login.fields._password.as('password').name}
					disabled={isInputDisabled}
					klass="absolute items-center left-1/2 -translate-x-1/2 transition duration-300 ease-in-out {userSelected ||
					manualLogin
						? 'visible opacity-90 -translate-y-35'
						: 'opacity-0 translate-y-30 invisible'} {errored ? 'bg-red-500/20!' : ''}"
					onchange={() => (errored = false)}
				/>
				<div
					class="absolute items-center left-1/2 -translate-x-1/2 transition duration-300 ease-in-out {userSelected ||
					manualLogin
						? 'visible opacity-90 -translate-y-25'
						: 'opacity-0 translate-y-30 invisible'}"
				>
					<Button type="submit" variant="secondary" disabled={isInputDisabled}>
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
