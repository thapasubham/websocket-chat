<script lang="ts">
    import Toast from "./Toast.svelte";

    let showToast = true;
    export let status = "";
    export let duration = 1000;
</script>

{#if showToast}
    <Toast {status} on:done={() => (showToast = false)} {duration} />
{/if}
