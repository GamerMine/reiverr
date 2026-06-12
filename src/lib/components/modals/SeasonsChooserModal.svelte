<script lang="ts">
	import ModalContainer from '$lib/components/common/modal/ModalContainer.svelte';
	import ModalHeader from '$lib/components/common/modal/ModalHeader.svelte';
	import { _ } from 'svelte-i18n';
	import { modalStack } from '$lib/stores/modal.store';

	let {
		modalId,
		endChoice
	}: {
		modalId: symbol;
		endChoice: () => boolean | undefined;
	} = $props();

	function userClose() {
		endChoice();
		modalStack.close(modalId);
	}
</script>

<ModalContainer>
	<ModalHeader close={userClose} text={$_('ui.modal.seasonsChooser.title')} />
</ModalContainer>
