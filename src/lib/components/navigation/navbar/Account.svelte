<script lang="ts">
	import IconButton from '#lib/components/controls/IconButton.svelte';
	import AccountIImage from '#lib/components/images/AccountIImage.svelte';
	import AccountPane from '#lib/components/navigation/navbar/AccountPane.svelte';
	import { tasksMenu } from '#lib/stores/tasksMenu.svelte.ts';

	let openAccountMenu = $state(false);
	let menuElt: HTMLDivElement | undefined = $state();

	function handleClickOutside(e: MouseEvent) {
		if (menuElt && !menuElt.contains(e.target as Node)) {
			openAccountMenu = false;
		}
	}

	$effect(() => {
		if (menuElt) setTimeout(() => document.addEventListener('click', handleClickOutside), 10);
		else document.removeEventListener('click', handleClickOutside);

		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<div class="flex">
	{#if tasksMenu.unseenError}
		<div class="flex max-h-4 min-w-4 justify-center rounded-full bg-red-600">
			<p class="text-xs">!</p>
		</div>
	{/if}
	<IconButton
		class={tasksMenu.unseenError ? '-ml-2' : ''}
		onclick={() => (openAccountMenu = !openAccountMenu)}
	>
		<AccountIImage user={JSON.parse(localStorage.getItem('user') || '{}') || undefined} size={8} />
	</IconButton>
</div>

{#if openAccountMenu}
	<div bind:this={menuElt}>
		<AccountPane onclick={() => (openAccountMenu = false)} />
	</div>
{/if}
