<script lang="ts">
	let { username }: { username: string | undefined } = $props();
</script>

<div class="space-y-3 w-30">
	<div class="rounded-md w-30 h-30 bg-yellow-300"></div>
	<div class="flex justify-center-safe truncate">{username}</div>
</div>
