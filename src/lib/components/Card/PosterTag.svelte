<script lang="ts">
	import classNames from 'classnames';

	let { value = '', filled = false }: { value?: string; filled?: boolean } = $props();
</script>

<div
	class={classNames('border rounded-sm p-[0px] px-1 text-[10px] font-medium', {
		'text-zinc-200 border-zinc-500': !filled,
		'bg-zinc-200 border-zinc-200 text-zinc-900': filled
	})}
>
	{value}
</div>
