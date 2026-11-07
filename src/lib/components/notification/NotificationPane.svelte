<script lang="ts">
	import { notificationStack } from '#lib/stores/notification.store.js';
	import { flip } from 'svelte/animate';
</script>

<div class="fixed right-8 bottom-8 z-50 flex flex-col gap-4">
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
