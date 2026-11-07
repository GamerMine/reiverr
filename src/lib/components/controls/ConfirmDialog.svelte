<script lang="ts">
	import Button from '#lib/components/controls/Button.svelte';
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

<div class="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" transition:blur>
	<div class="w-full max-w-sm rounded-lg bg-zinc-800/80 p-6 shadow-lg">
		<p class="mb-4 text-white">{confirmMessage}</p>
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
