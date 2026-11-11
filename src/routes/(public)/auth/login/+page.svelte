<script lang="ts">
	import UserCarousel from '#lib/components/carousel/UserCarousel.svelte';
	import UserCard from '#lib/components/cards/UserCard.svelte';
	import { _ } from 'svelte-i18n';
	import Button from '#lib/components/controls/Button.svelte';
	import { Keyboard, Enter, Update, IdCard } from 'svelte-radix';
	import Input from '#lib/components/controls/Input.svelte';
	import { ChevronLeft } from 'svelte-radix';
	import { createErrorNotification } from '#lib/stores/notification.store.js';
	import { jellyfinGetUsers } from '#lib/remote/jellyfin.remote.ts';
	import { goto } from '$app/navigation';
	import { login } from '#lib/remote/login.remote.ts';
	import { ScaleOut } from 'svelte-loading-spinners';
	import type { JellyfinUserDto } from '@unifarr/connectors/types/radarr';
	import { resolve } from '$app/paths';

	let { data } = $props();

	let manualLogin: boolean = $state(false);
	let userSelected: boolean = $state(false);
	let selectedUser: JellyfinUserDto | undefined = $state();
	let isInputDisabled: boolean = $state(false);
	let errored: boolean = $state(false);

	function askForPassword(user: JellyfinUserDto) {
		if (data.oidcOnly) return;

		userSelected = true;
		selectedUser = user;
		if (selectedUser?.Name) login.fields.username.set(selectedUser.Name);
	}

	$effect(() => {
		if (login.result) {
			if (login.result.success && login.result.data) {
				localStorage.setItem('user', JSON.stringify(login.result.data));
				goto(resolve('/(app)', {}));
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

	$effect(() => {
		if (data.oidcError) {
			createErrorNotification($_('general.error'), $_('general.unknownError'));
		}
	});
</script>

<div class="contents">
	{#await jellyfinGetUsers()}
		<!-- TODO: If the Jellyfin instance is unreachable, show it to the user, add a timeout ? -->
		<div class="flex h-full items-center justify-center">
			<ScaleOut color="#C27AFF" />
		</div>
	{:then users}
		<div class="z-10">
			<div class="flex items-center justify-center gap-2 rounded-xs pt-20">
				<div class="mr-2 h-10 w-10 rotate-45 rounded-md bg-purple-500"></div>
				<h1 class="font-display text-5xl font-semibold tracking-wider uppercase">
					Unifarr
				</h1>
			</div>
			<h1
				class="font-display flex w-screen items-center justify-center pt-10 text-4xl font-semibold"
			>
				{$_('login.whoWatching')}
			</h1>
			<div
				class="absolute top-1/2 left-1/2 w-full -translate-x-1/2 -translate-y-1/2 items-center sm:w-1/2"
			>
				<UserCarousel
					klass="transition duration-300 ease-in-out {userSelected || manualLogin
						? 'invisible opacity-0 -translate-y-30'
						: 'visible'}"
				>
					{#each users.data as user (user)}
						<UserCard
							{user}
							onclick={() => askForPassword(user)}
							clickable={!data.oidcOnly}
						></UserCard>
					{/each}
				</UserCarousel>
			</div>
			<div
				class="flex justify-center pt-100 transition duration-300 ease-in-out {userSelected ||
				manualLogin
					? 'invisible opacity-0'
					: ''}"
			>
				<div class="flex flex-col items-center space-y-2">
					<Button
						variant="tertiary"
						onclick={() => {
							manualLogin = true;
						}}
						disabled={data.oidcOnly}
					>
						<span class="mr-1">{$_('login.manualLogin')}</span><Keyboard size="20" />
					</Button>
					{#if data.oidcEnabled}
						<Button variant="tertiary" href={'/auth/login?oidc'}>
							<span class="mr-1">{data.oidcLabel ?? $_('login.oidcLogin')}</span
							><IdCard size="20" />
						</Button>
					{/if}
				</div>
			</div>
		</div>

		<div class="z-10">
			<button
				class="absolute left-1/2 -translate-x-35 -translate-y-95 items-center transition duration-300 ease-in-out {userSelected ||
				manualLogin
					? 'visible opacity-100'
					: 'invisible opacity-0'}"
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
					class="absolute left-1/2 -translate-x-1/2 items-center transition duration-300 ease-in-out {userSelected ||
					manualLogin
						? 'visible -translate-y-25 opacity-90'
						: 'invisible translate-y-30 opacity-0'}"
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
