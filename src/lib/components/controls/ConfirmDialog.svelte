<script lang="ts">
	import Button from '$lib/components/controls/Button.svelte';
	import { blur } from 'svelte/transition';
	import { _ } from 'svelte-i18n';

	let {
		onConfirm,
		confirmMessage,
		variant
	}: {
		onConfirm: (confirm: boolean) => void;
		confirmMessage: string;
		variant: 'confirm' | 'yesNo';
	} = $props();
</script>

<div class="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50" transition:blur>
	<div class="bg-zinc-800/50 rounded-lg p-6 shadow-lg max-w-sm w-full">
		<p class="text-white mb-4">{confirmMessage}</p>
		{#if variant === 'confirm'}
			<div class="flex justify-end gap-4">
				<Button variant="secondary" onclick={() => onConfirm(true)}
					>{$_('settings.misc.continue')}</Button
				>
			</div>
		{:else if variant === 'yesNo'}
			<div class="flex justify-between gap-4">
				<Button variant="secondary" onclick={() => onConfirm(false)}
					>{$_('settings.misc.cancel')}</Button
				>
				<Button variant="error" onclick={() => onConfirm(true)}
					>{$_('settings.misc.continue')}</Button
				>
			</div>
		{/if}
	</div>
</div>
