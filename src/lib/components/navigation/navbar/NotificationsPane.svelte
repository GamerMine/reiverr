<script lang="ts">
	import { ChevronLeft } from 'svelte-radix';
	import { _ } from 'svelte-i18n';
	import classNames from 'classnames';
	import Divider from '$lib/components/layout/Divider.svelte';
	import { TaskState, type TaskStatus } from '@reiverr/db/types';

	let {
		tasks
	}: {
		tasks: TaskStatus[];
	} = $props();

	function fillTemplate(message: string, data: any | undefined) {
		if (!data) return message;
		for (const [key, value] of Object.entries(data)) {
			message = message.replaceAll(`{${key}}`, value as string);
		}
		return message;
	}
</script>

<div class="fixed top-20 right-3 bg-neutral-800 rounded-xl p-2 min-w-2xs max-w-sm">
	<div class="flex">
		<ChevronLeft />
		<p>{$_('settings.misc.back')}</p>
	</div>
	<Divider />
	<div class="bg-neutral-700 p-1 rounded-xl overflow-y-auto max-h-60">
		{#each tasks as task}
			<div
				class={classNames('bg-green-500/10 p-2 rounded-md mt-1', {
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
