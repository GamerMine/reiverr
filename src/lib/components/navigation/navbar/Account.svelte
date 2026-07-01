<script lang="ts">
	import IconButton from '$lib/components/controls/IconButton.svelte';
	import AccountIImage from '$lib/components/images/AccountIImage.svelte';
	import AccountPane from '$lib/components/navigation/navbar/AccountPane.svelte';
	import NotificationsPane from '$lib/components/navigation/navbar/NotificationsPane.svelte';
	import { getCompletedTasks } from '$lib/remote/tasks.remote.ts';
	import { TaskState } from '@reiverr/db/types';

	let openAccountMenu = $state(false);
	let openNotificationsMenu = $state(false);
	let menuElt: HTMLDivElement | undefined = $state();
	let completedTasks = $derived(await getCompletedTasks());
	let showErrorTooltip = $state(false);

	function handleClickOutside(e: MouseEvent) {
		if (menuElt && !menuElt.contains(e.target as Node)) {
			openAccountMenu = false;
			openNotificationsMenu = false;
		}
	}

	$effect(() => {
		const seenErrors: string[] = JSON.parse(
			localStorage.getItem('notificationsSeenErrors') || '[]'
		);
		const erroredTasks = completedTasks
			.filter((t) => t.state === TaskState.ERROR)
			.map((t) => t.uuid);

		for (const erroredTask of erroredTasks) {
			if (!seenErrors.includes(erroredTask)) {
				showErrorTooltip = true;
				break;
			}
		}
	});

	$effect(() => {
		if (menuElt) setTimeout(() => document.addEventListener('click', handleClickOutside), 10);
		else document.removeEventListener('click', handleClickOutside);

		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<div class="flex">
	{#if showErrorTooltip}
		<div class="rounded-full bg-red-600 min-w-4 max-h-4 flex justify-center">
			<p class="text-xs">!</p>
		</div>
	{/if}
	<IconButton
		class={showErrorTooltip ? '-ml-2' : ''}
		onclick={() => (openAccountMenu = !openAccountMenu)}
	>
		<AccountIImage
			user={JSON.parse(localStorage.getItem('user') || '{}') || undefined}
			size={8}
		/>
	</IconButton>
</div>

{#if openNotificationsMenu}
	<div bind:this={menuElt}>
		<NotificationsPane
			tasks={completedTasks}
			back={() => {
				openNotificationsMenu = false;
				openAccountMenu = true;
			}}
		/>
	</div>
{:else if openAccountMenu}
	<div bind:this={menuElt}>
		<AccountPane
			onclick={(menu) => {
				if (menu === 'notifications') {
					openNotificationsMenu = true;
					showErrorTooltip = false;
					const erroredTasks = completedTasks
						.filter((t) => t.state === TaskState.ERROR)
						.map((t) => t.uuid);
					localStorage.setItem('notificationsSeenErrors', JSON.stringify(erroredTasks));
				} else openAccountMenu = false;
			}}
		/>
	</div>
{/if}
