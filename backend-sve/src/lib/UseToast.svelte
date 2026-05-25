<script lang="ts">
    import Toast from "./Toast.svelte";

    export let status = "";
    export let duration = 1000;

    let showToast = false;

    $: if (status) {
        showToast = true;
    }
</script>

{#if showToast}
    <Toast {status} {duration} on:done={() => (showToast = false)} />
{/if}
