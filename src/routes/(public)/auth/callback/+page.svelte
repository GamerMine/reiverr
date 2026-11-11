<script>
	import Button from '#lib/components/controls/Button.svelte';
	import { _ } from 'svelte-i18n';
	import { ChevronLeft } from 'svelte-radix';
	import { ScaleOut } from 'svelte-loading-spinners';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	const { data } = $props();

	$effect(() => {
		if (data.user) {
			localStorage.setItem('user', JSON.stringify(data.user));
			window.parent.postMessage('tokenRenewed');
			setTimeout(() => goto(resolve('/', {})), 1000);
		} else {
			window.parent.postMessage('tokenNotRenewed');
		}
	});
</script>

<div class="flex h-screen flex-col items-center justify-center">
	{#if data.user}
		<ScaleOut color="#C27AFF" />
	{:else}
		<p class="mb-5 text-2xl">{data.oidcError}</p>
		<p class="text-1xl mb-5">{data.oidcErrorDescription}</p>
		<Button variant="primary" href="/auth/login">
			<span class="flex"><ChevronLeft />{$_('login.goBack')}</span>
		</Button>
	{/if}
</div>
