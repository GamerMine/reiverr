<script lang="ts">
    import {flip} from 'svelte/animate';
    import {notification} from "$lib/stores/notification.store";
</script>

<div class="fixed bottom-8 right-8 z-50 flex flex-col gap-4">
    {#each notification.stack as notif (notif.id)}
        <div animate:flip={{ duration: 500 }}>
            <svelte:component
                    this={notif.component}
                    id={notif.id}
                    duration={notif.duration}
                    {...notif.props}
            />
        </div>
    {/each}
</div>
