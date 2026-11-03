<script lang="ts">
	import { Cross1, HamburgerMenu, MagnifyingGlass } from 'svelte-radix';
	import classNames from 'classnames';
	import { page } from '$app/state';
	import TitleSearchModal from '../../modals/TitleSearchModal.svelte';
	import IconButton from '#lib/components/controls/IconButton.svelte';
	import { fade } from 'svelte/transition';
	import { modalStack } from '#lib/stores/modal.store.js';
	import { _ } from 'svelte-i18n';
	import Divider from '#lib/components/layout/Divider.svelte';
	import { goto } from '$app/navigation';
	import Account from '#lib/components/navigation/navbar/Account.svelte';
	import { logout } from '#lib/remote/login.remote.ts';

	let y = $state(0);
	let transparent = true;
	let baseStyle = $state('');

	let openAccountMenu = $state(false);
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

	$effect(() => {
		transparent = y <= 0;
		baseStyle = classNames(
			'fixed px-8 inset-x-0 grid-cols-[min-content_1fr_min-content] items-center z-10',
			'transition-all',
			{
				'bg-stone-900/50 backdrop-blur-2xl':
					(!isMobileMenuVisible || !openAccountMenu) && !transparent,
				'h-16': !transparent,
				'h-16 sm:h-24': transparent
			}
		);
	});
</script>

<svelte:window bind:scrollY={y} on:keydown={handleShortcuts} />

<div class={classNames(baseStyle, 'hidden sm:grid')}>
	<a
		href="/"
		class="selectable -mx-2 hidden items-center gap-2 rounded-xs px-2 hover:text-inherit sm:flex"
	>
		<div class="h-4 w-4 rounded-full bg-amber-300"></div>
		<h1 class="font-display text-xl font-semibold tracking-wider uppercase">Reiverr</h1>
	</a>
	<div
		class="flex items-center justify-center gap-4 text-sm font-normal tracking-wider text-zinc-200 md:gap-8"
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
	</div>
	<div class="flex items-center gap-2">
		<IconButton onclick={openSearchModal}>
			<MagnifyingGlass size="20" />
		</IconButton>
		<Account />
	</div>
</div>

<div class={classNames(baseStyle, ' grid sm:hidden')}>
	<a
		href="/static"
		class="selectable -mx-2 flex items-center gap-2 rounded-xs px-2 hover:text-inherit"
	>
		<div class="h-4 w-4 rounded-full bg-amber-300"></div>
		<h1 class="font-display text-xl font-semibold tracking-wider uppercase">Reiverr</h1>
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
		class="fixed inset-0 bottom-0 z-9 grid grid-rows-3 bg-stone-900/50 pt-16 backdrop-blur-2xl transition-all ease-linear"
		transition:fade={{ duration: 150 }}
	>
		<div class="row-span-2 flex flex-col items-center justify-center gap-4">
			<a
				onclick={() => (isMobileMenuVisible = false)}
				href="/static"
				class={page && getLinkStyle('/')}
			>
				{$_('navbar.home')}
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
			<Divider />
			<a
				onclick={() => (isMobileMenuVisible = false)}
				href="/settings"
				class={page && getLinkStyle('/settings')}
			>
				{$_('navbar.userMenu.settings')}
			</a>
			<a
				onclick={async () => {
					isMobileMenuVisible = false;
					await logout();
					await goto('/');
				}}
				href="/auth/login"
				class={page && getLinkStyle('/auth/login')}
			>
				{$_('navbar.userMenu.logout')}
			</a>
		</div>
	</div>
{/if}
