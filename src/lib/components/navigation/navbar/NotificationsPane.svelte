<script lang="ts">
	import { slide } from 'svelte/transition';
	import { ChevronLeft } from 'svelte-radix';
	import { _ } from 'svelte-i18n';
	import classNames from 'classnames';
	import Divider from '#lib/components/layout/Divider.svelte';
	import { TaskState, type TaskStatus } from '@reiverr/db/types';

	let {
		tasks,
		back
	}: {
		tasks: TaskStatus[];
		back: () => void;
	} = $props();

	function fillTemplate(message: string, data: any | undefined) {
		if (!data) return message;
		for (const [key, value] of Object.entries(data)) {
			message = message.replaceAll(`{${key}}`, value as string);
		}
		return message;
	}
</script>

<div
	class="fixed top-20 right-3 max-w-sm min-w-2xs rounded-xl bg-neutral-800 p-2"
	transition:slide={{ duration: 500 }}
>
	<a class="flex cursor-pointer" onclick={back}>
		<ChevronLeft />
		<p>{$_('settings.misc.back')}</p>
	</a>
	<Divider />
	<div class="max-h-60 overflow-y-auto rounded-xl bg-neutral-700 p-1">
		{#each tasks as task}
			<div
				class={classNames('mt-1 rounded-md bg-green-500/10 p-2', {
					'bg-red-500/10': task.state === TaskState.ERROR
				})}
			>
				<p class="font-bold">{$_('service.taskName.' + task.type)}</p>
				<p class="text-xs text-neutral-400">
					{task.completionDate.toLocaleDateString() +
						' - ' +
						task.completionDate.toLocaleTimeString()}
				</p>
				<Divider />
				<p class="text-neutral-300">
					{fillTemplate(
						$_(
							'service.tasks.' +
								task.type +
								(task.state === TaskState.ERROR ? '.error' : '.success')
						),
						task.data
					)}
				</p>
			</div>
		{/each}
	</div>
</div>
