<script lang="ts">
	import { fade, fly, slide } from 'svelte/transition';
	import { _ } from 'svelte-i18n';
	import classNames from 'classnames';
	import { ChevronDown, ChevronUp, Clock, Cross2, Update } from 'svelte-radix';
	import IconButton from '#lib/components/controls/IconButton.svelte';
	import Divider from '#lib/components/layout/Divider.svelte';
	import { getCompletedTasks, getQueuedTasks } from '#lib/remote/tasks.remote.ts';
	import { tasksMenu } from '#lib/stores/tasksMenu.svelte.ts';
	import { fillTemplate, taskMessageKey } from '#lib/utils/tasks.ts';
	import { TaskState, type TaskStatus } from '@unifarr/db/types';

	let queued = $derived(await getQueuedTasks());
	let completed = $derived(await getCompletedTasks());

	let running = $derived(queued.filter((t) => t.state === TaskState.RUNNING));
	let scheduled = $derived(queued.filter((t) => t.state !== TaskState.RUNNING));
	let current = $derived(running[0] ?? scheduled[0]);
	let latest = $derived(completed[0]);

	// Auto-open the OSD only when a new failed task appears.
	let knownErrors: Set<string> | undefined;
	$effect(() => {
		const errors = completed.filter((t) => t.state === TaskState.ERROR).map((t) => t.uuid);
		if (knownErrors && errors.some((id) => !knownErrors!.has(id))) tasksMenu.open(false);
		knownErrors = new Set(errors);
	});

	// Error badge handling.
	$effect(() => {
		const errors = completed.filter((t) => t.state === TaskState.ERROR).map((t) => t.uuid);
		if (tasksMenu.visible && tasksMenu.expanded) {
			tasksMenu.markErrorsSeen(errors);
		} else {
			tasksMenu.unseenError = errors.some((id) => !tasksMenu.seenErrors.includes(id));
		}
	});

	function date(d: Date | null | undefined) {
		return d ? d.toLocaleDateString() + ' - ' + d.toLocaleTimeString() : '';
	}
</script>

{#snippet taskRow(task: TaskStatus)}
	<div
		class={classNames('mt-1 rounded-md p-2', {
			'bg-red-500/10': task.state === TaskState.ERROR,
			'bg-green-500/10': task.state === TaskState.COMPLETED,
			'bg-zinc-500/10': task.state === TaskState.QUEUED || task.state === TaskState.RUNNING
		})}
	>
		<div class="flex items-center gap-2">
			{#if task.state === TaskState.RUNNING}
				<Update size="16" class="animate-spin" />
			{:else if task.state === TaskState.QUEUED}
				<Clock size="16" />
			{/if}
			<p class="font-bold">{$_('service.taskName.' + task.type)}</p>
		</div>
		<p class="text-xs text-neutral-400">
			{#if task.state === TaskState.QUEUED}
				{task.scheduledDate
					? $_('tasks.scheduledAt', { values: { date: date(task.scheduledDate) } })
					: $_('tasks.scheduled')}
			{:else if task.state === TaskState.RUNNING}
				{$_('tasks.running')}
			{:else}
				{date(task.completionDate)}
			{/if}
		</p>
		{#if task.state === TaskState.COMPLETED || task.state === TaskState.ERROR}
			<Divider />
			<p class="text-neutral-300">{fillTemplate($_(taskMessageKey(task)), task.data)}</p>
		{/if}
	</div>
{/snippet}

{#if tasksMenu.visible}
	<div
		class="fixed right-8 bottom-8 z-40 w-80 rounded-lg bg-zinc-900/60 p-2 shadow-lg backdrop-blur-xl"
		in:fly={{ y: 20, duration: 250 }}
		out:fade={{ duration: 150 }}
	>
		<div class="flex items-center gap-2">
			<div class="relative flex min-w-0 flex-1 items-center gap-2 px-1">
				{#if tasksMenu.unseenError}
					<div
						class="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-red-600"
					>
						<p class="text-xs">!</p>
					</div>
				{:else if running.length}
					<Update size="16" class="shrink-0 animate-spin" />
				{:else if current}
					<Clock size="16" class="shrink-0" />
				{/if}
				<p class="truncate text-sm">
					{#if current}
						{$_('service.taskName.' + current.type)}
						{#if queued.length > 1}<span class="text-neutral-400">(+{queued.length - 1})</span
							>{/if}
					{:else if latest}
						{$_('service.taskName.' + latest.type)}
					{:else}
						{$_('tasks.empty')}
					{/if}
				</p>
			</div>
			<IconButton onclick={() => tasksMenu.toggleExpanded()}>
				{#if tasksMenu.expanded}<ChevronDown size="18" />{:else}<ChevronUp size="18" />{/if}
			</IconButton>
			<IconButton onclick={() => tasksMenu.close()}><Cross2 size="18" /></IconButton>
		</div>

		{#if tasksMenu.expanded}
			<div transition:slide={{ duration: 250 }}>
				<Divider />
				<div class="max-h-80 overflow-y-auto rounded-xl bg-neutral-800/60 p-1">
					{#if queued.length}
						<p class="px-1 pt-1 text-xs text-neutral-400 uppercase">{$_('tasks.inProgress')}</p>
						{#each [...running, ...scheduled] as task (task.uuid)}
							{@render taskRow(task)}
						{/each}
					{/if}
					<p class="px-1 pt-2 text-xs text-neutral-400 uppercase">{$_('tasks.history')}</p>
					{#each completed as task (task.uuid)}
						{@render taskRow(task)}
					{:else}
						<p class="p-2 text-sm text-neutral-400">{$_('tasks.empty')}</p>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}
