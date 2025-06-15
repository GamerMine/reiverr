<script lang="ts">
	import FormButton from '$lib/components/Forms/FormButton.svelte';
	import { onDestroy, type ComponentProps } from 'svelte';
	import { _ } from 'svelte-i18n';

	let { handleHealthCheck }: { handleHealthCheck: () => Promise<boolean | undefined> } = $props();

	let type: ComponentProps<typeof FormButton>['type'] = $state('base');
	let loading = $state(false);

	let healthTimeout: NodeJS.Timeout;
	$effect(() => {
		if (type !== 'base') {
			clearTimeout(healthTimeout);
			healthTimeout = setTimeout(() => {
				type = 'base';
			}, 2000);
		}
	});

	function handleClick() {
		loading = true;
		handleHealthCheck().then((ok) => {
			if (ok) {
				type = 'success';
			} else {
				type = 'error';
			}
			loading = false;
		});
	}

	onDestroy(() => {
		clearTimeout(healthTimeout);
	});
</script>

<FormButton {type} {loading} onclick={handleClick}
	>{$_('settings.integrations.testConnection')}</FormButton
>
