<script lang="ts">
	import { notificationStack } from '#lib/stores/notification.store.js';
	import { flip } from 'svelte/animate';
	import { tasksMenu } from '#lib/stores/tasksMenu.svelte.ts';
</script>

<div
	class="fixed right-8 z-50 flex flex-col gap-4 transition-[bottom]"
	class:bottom-8={!tasksMenu.visible}
	class:bottom-24={tasksMenu.visible}
>
	{#each $notificationStack as notification (notification.id)}
		<div animate:flip={{ duration: 500 }}>
			<svelte:component
				this={notification.component}
				id={notification.id}
				duration={notification.duration}
				{...notification.props}
			/>
		</div>
	{/each}
</div>
