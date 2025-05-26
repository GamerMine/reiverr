<script lang="ts">
	import classNames from 'classnames';

	let { large = false }: { large?: boolean } = $props();
</script>

<div
	class={classNames('placeholder w-full rounded-xl', {
		'h-16': !large,
		'h-28': large
	})}
></div>
