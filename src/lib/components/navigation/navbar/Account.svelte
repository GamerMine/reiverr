<script lang="ts">
	import IconButton from '$lib/components/controls/IconButton.svelte';
	import AccountIImage from '$lib/components/images/AccountIImage.svelte';
	import AccountPane from '$lib/components/navigation/navbar/AccountPane.svelte';
	import NotificationsPane from '$lib/components/navigation/navbar/NotificationsPane.svelte';
	import { getCompletedTasks } from '$lib/remote/tasks.remote.ts';

	let openAccountMenu = $state(false);
	let openNotificationsMenu = $state(false);
	let elt: HTMLDivElement | undefined = $state();
	let completedTasks = $derived(await getCompletedTasks());

	function handleClickOutside(e: MouseEvent) {
		if (elt && !elt.contains(e.target as Node)) openAccountMenu = false;
	}

	$effect(() => {
		if (elt) setTimeout(() => document.addEventListener('click', handleClickOutside), 10);
		else document.removeEventListener('click', handleClickOutside);

		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<IconButton onclick={() => (openAccountMenu = !openAccountMenu)}>
	<AccountIImage user={JSON.parse(localStorage.getItem('user') || '{}') || undefined} size={8} />
</IconButton>

{#if openAccountMenu}
	<div bind:this={elt}>
		<AccountPane
			onclick={(menu) => {
				openAccountMenu = false;
				if (menu === 'notifications') openNotificationsMenu = true;
			}}
		/>
	</div>
{:else if openNotificationsMenu}
	<div bind:this={elt}>
		<NotificationsPane tasks={completedTasks} />
	</div>
{/if}
