<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Logger, { LogLevel } from '@reiverr/logging';

	const logger = Logger.getLogger('OidcTokenRenewer');

	let renewalInProgress: boolean = $state(false);

	function schedule() {
		renewalInProgress = false;
		setTimeout(renew, 1000 * 60 * 10);
	}

	function cancel() {
		logger.log(LogLevel.ERROR, 'Unable to renew token');
		if (renewalInProgress) {
			goto(resolve('/auth/login', {}));
		}
	}

	function renew() {
		renewalInProgress = true;
		setTimeout(cancel, 1000 * 30);
		logger.log(LogLevel.INFO, 'Renewing token');
	}

	function handleMessage(event: MessageEvent) {
		switch (event.data) {
			case 'tokenRenewed':
				logger.log(LogLevel.INFO, 'Token renewed');
				schedule();
				break;
			case 'tokenNotRenewed':
				cancel();
				break;
		}
	}

	$effect(() => {
		window.addEventListener('message', handleMessage);

		schedule();
	});
</script>

{#if renewalInProgress}
	<iframe title="OIDC Token renewer" class="hidden" src="/auth/login?oidc&silent"></iframe>
{/if}
