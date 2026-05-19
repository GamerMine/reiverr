<script lang="ts">
    import {getContext, onDestroy} from "svelte";

    let {
        value,
        label
    }: {
        value: string;
        label: string;
    } = $props();

    const { register, unregister } = getContext('select');

    register({ value, label });

    onDestroy(() => unregister({ value, label }));
</script>