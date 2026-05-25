<script lang="ts">
    import { createEventDispatcher, onMount, onDestroy } from "svelte";

    const dispatch = createEventDispatcher();

    export let status: string = "";
    export let duration: number = 1000;

    let timeout: ReturnType<typeof setTimeout>;

    onMount(() => {
        timeout = setTimeout(() => {
            dispatch("done");
        }, duration);
    });

    onDestroy(() => {
        clearTimeout(timeout);
    });
</script>

<div class="fixed top-4 right-4 z-50">
    <div
        class="bg-green-500 text-white px-4 py-2 rounded-md shadow-lg animate-in fade-in slide-in-from-right"
    >
        {status}
    </div>
</div>
