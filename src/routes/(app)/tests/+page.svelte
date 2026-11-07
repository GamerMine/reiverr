<script lang="ts">
	import Button from '#lib/components/controls/Button.svelte';
	import { testAddTask } from '#lib/remote/test.remote.ts';
</script>

<div class="min-h-screen w-full gap-2 px-10 sm:pt-24">
	<h1>Task system tests</h1>
	<div class="mt-2 flex gap-2">
		<Button onclick={async () => await testAddTask({})}>
			<p>Add successful task</p>
		</Button>
		<Button onclick={async () => testAddTask({ failAtQueueThrow: true })}>
			<p>Add queue throw failed task</p>
		</Button>
		<Button onclick={async () => testAddTask({ failAtExecutionThrow: true })}>
			<p>Add execution throw failed task</p>
		</Button>
		<Button onclick={async () => testAddTask({ failAtQueue: true })}>
			<p>Add queue failed task</p>
		</Button>
		<Button onclick={async () => testAddTask({ failAtExecution: true })}>
			<p>Add execution failed task</p>
		</Button>
	</div>
</div>
