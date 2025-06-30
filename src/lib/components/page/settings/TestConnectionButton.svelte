<script lang="ts">
	import { onDestroy, type ComponentProps } from 'svelte';
	import { _ } from 'svelte-i18n';
	import Button from '$lib/components/common/inputs/buttons/Button.svelte';
	import { Update } from 'svelte-radix';

	let { handleHealthCheck }: { handleHealthCheck: () => Promise<boolean | undefined> } = $props();

	let variant: ComponentProps<typeof Button>['variant'] = $state('secondary');
	let loading = $state(false);

	let healthTimeout: NodeJS.Timeout;
	$effect(() => {
		if (variant !== 'secondary') {
			clearTimeout(healthTimeout);
			healthTimeout = setTimeout(() => {
				variant = 'secondary';
			}, 2000);
		}
	});

	function handleClick() {
		loading = true;
		handleHealthCheck().then((ok) => {
			if (ok) {
				variant = 'success';
			} else {
				variant = 'error';
			}
			loading = false;
		});
	}

	onDestroy(() => {
		clearTimeout(healthTimeout);
	});
</script>

<Button {variant} onclick={handleClick}>
	{#if loading}
		<Update class="animate-spin" size="20" />
	{/if}
	{$_('settings.integrations.testConnection')}
</Button>
