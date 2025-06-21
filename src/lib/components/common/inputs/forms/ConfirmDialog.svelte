<script lang="ts">
	import Button from '$lib/components/common/inputs/buttons/Button.svelte';
	import { _ } from 'svelte-i18n';

	let { onConfirm, confirmMessage }: { onConfirm: () => void; confirmMessage: string } = $props();
</script>

<div class="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
	<div class="bg-zinc-800/50 rounded-lg p-6 shadow-lg max-w-sm w-full">
		<p class="text-white mb-4">{confirmMessage}</p>
		<div class="flex justify-end gap-4">
			<Button variant="secondary" onclick={onConfirm}>{$_('settings.misc.continue')}</Button>
		</div>
	</div>
</div>
