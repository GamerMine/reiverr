<script lang="ts">
	import { Cross1, HamburgerMenu, MagnifyingGlass } from 'svelte-radix';
	import classNames from 'classnames';
	import { page } from '$app/state';
	import TitleSearchModal from './TitleSearchModal.svelte';
	import IconButton from '../IconButton.svelte';
	import { fade } from 'svelte/transition';
	import { modalStack } from '$lib/stores/modal.store';
	import { _ } from 'svelte-i18n';
	import { jellyfinGetUserImage, type JellyfinUser } from '$lib/apis/jellyfin/jellyfinApi';
	import { onMount } from 'svelte';

	let y = $state(0);
	let transparent = true;
	let baseStyle = $state('');
	let userPicture: HTMLDivElement | undefined = $state();

	let isMobileMenuVisible = $state(false);

	function getLinkStyle(path: string) {
		return classNames('selectable rounded-xs px-2 -mx-2 sm:text-base text-xl', {
			'text-amber-200': page.url.pathname === path,
			'hover:text-zinc-50 cursor-pointer': page.url.pathname !== path
		});
	}

	function openSearchModal() {
		modalStack.create(TitleSearchModal, {});
	}

	function handleShortcuts(event: KeyboardEvent) {
		if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			openSearchModal();
		}
	}

	async function getProfilePicture(user: JellyfinUser | undefined, contentDiv: HTMLDivElement) {
		if (contentDiv) {
			contentDiv.innerHTML = '';
			if (user && user.Id && user.Name) {
				let ppBlob = await jellyfinGetUserImage(user.Id);
				if (ppBlob.size !== 0) {
					let img = document.createElement('img');

					img.src = URL.createObjectURL(ppBlob);
					img.alt = 'pp';
					img.className = 'rounded-md w-8 h-8 object-cover';

					contentDiv.appendChild(img);
				} else {
					let h1 = document.createElement('h1');

					h1.innerText = user.Name.charAt(0);
					h1.className = 'uppercase text-xl';

					contentDiv.appendChild(h1);
				}
			} else {
				let h1 = document.createElement('h1');

				h1.innerText = '?';
				h1.className = 'uppercase text-2xl';

				contentDiv.appendChild(h1);
			}
		}
	}

	$effect(() => {
		transparent = y <= 0;
		baseStyle = classNames(
			'fixed px-8 inset-x-0 grid-cols-[min-content_1fr_min-content] items-center z-10',
			'transition-all',
			{
				'bg-stone-900/50 backdrop-blur-2xl': !isMobileMenuVisible && !transparent,
				'h-16': !transparent,
				'h-16 sm:h-24': transparent
			}
		);
	});

	onMount(() => {
		if (userPicture) {
			const user: JellyfinUser | undefined =
				JSON.parse(localStorage.getItem('user') || '{}') || undefined;

			getProfilePicture(user, userPicture);
		}
	});
</script>

<svelte:window bind:scrollY={y} on:keydown={handleShortcuts} />

<div class={classNames(baseStyle, 'hidden sm:grid')}>
	<a
		href="/"
		class="hidden sm:flex gap-2 items-center hover:text-inherit selectable rounded-xs px-2 -mx-2"
	>
		<div class="rounded-full bg-amber-300 h-4 w-4"></div>
		<h1 class="font-display uppercase font-semibold tracking-wider text-xl">Reiverr</h1>
	</a>
	<div
		class="flex items-center justify-center gap-4 md:gap-8 font-normal text-sm tracking-wider text-zinc-200"
	>
		<a href="/" class={page && getLinkStyle('/')}>
			{$_('navbar.home')}
		</a>
		<a href="/library" class={page && getLinkStyle('/library')}>
			{$_('navbar.library')}
		</a>
		<a href="/sources" class={page && getLinkStyle('/sources')}>
			{$_('navbar.sources')}
		</a>
		<a href="/settings" class={page && getLinkStyle('/settings')}>
			{$_('navbar.settings')}
		</a>
	</div>
	<div class="flex gap-2 items-center">
		<IconButton onclick={openSearchModal}>
			<MagnifyingGlass size="20" />
		</IconButton>
		<div
			bind:this={userPicture}
			class="flex items-center justify-center w-8 h-8 bg-stone-900/90 rounded-md"
		>
			<h1 class="uppercase text-2xl">?</h1>
		</div>
	</div>
</div>

<div class={classNames(baseStyle, ' grid sm:hidden')}>
	<a href="/" class="flex gap-2 items-center hover:text-inherit selectable rounded-xs px-2 -mx-2">
		<div class="rounded-full bg-amber-300 h-4 w-4"></div>
		<h1 class="font-display uppercase font-semibold tracking-wider text-xl">Reiverr</h1>
	</a>
	<div></div>
	<div class="flex items-center gap-2">
		<IconButton onclick={openSearchModal}>
			<MagnifyingGlass size="20" />
		</IconButton>

		{#if isMobileMenuVisible}
			<IconButton onclick={() => (isMobileMenuVisible = false)}>
				<Cross1 size="20" />
			</IconButton>
		{:else}
			<IconButton onclick={() => (isMobileMenuVisible = true)}>
				<HamburgerMenu size="20" />
			</IconButton>
		{/if}
	</div>
</div>

{#if isMobileMenuVisible}
	<div
		class="fixed inset-0 pt-16 bottom-0 bg-stone-900/50 backdrop-blur-2xl z-[9] grid grid-rows-3 transition-all ease-linear"
		transition:fade={{ duration: 150 }}
	>
		<div class="row-span-2 flex flex-col gap-4 items-center justify-center">
			<a onclick={() => (isMobileMenuVisible = false)} href="/" class={page && getLinkStyle('/')}>
				{$_('navbar.home')}
			</a>
			<a
				onclick={() => (isMobileMenuVisible = false)}
				href="/discover"
				class={page && getLinkStyle('/discover')}
			>
				{$_('navbar.discover')}
			</a>
			<a
				onclick={() => (isMobileMenuVisible = false)}
				href="/library"
				class={page && getLinkStyle('/library')}
			>
				{$_('navbar.library')}
			</a>
			<a
				onclick={() => (isMobileMenuVisible = false)}
				href="/sources"
				class={page && getLinkStyle('/sources')}
			>
				{$_('navbar.sources')}
			</a>
			<a
				onclick={() => (isMobileMenuVisible = false)}
				href="/settings"
				class={page && getLinkStyle('/settings')}
			>
				{$_('navbar.settings')}
			</a>
		</div>
	</div>
{/if}
