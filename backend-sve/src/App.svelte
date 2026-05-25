<script lang="ts">
    import { io, Socket } from "socket.io-client";
    import { onMount } from "svelte";
    import Toast from "./lib/Toast.svelte";
    import UseToast from "./lib/UseToast.svelte";
    import ChatInterface from "./components/ChatInterface.svelte";
    let socket: Socket;
    let status = $state("");
    let isConnected = $state(false);
    let text = $state("");
    function Connect() {
        socket = io("ws://localhost:5000");

        socket.on("connect", () => {
            isConnected = true;
            status = "Connected Successfully";
            console.log("Connected:", socket.id);
        });

        socket.on("message", (data) => {
            status = "Failed to connect";

            isConnected = false;
            console.log("Received:", data);
        });
    }
    onMount(() => {});
</script>

<div class="flex">
    <div class="grid justify-center gap-3">
        {#if status}
            <UseToast {status} />
        {/if}
        <div class="text-gray-700 text-2xl">hello</div>

        <button
            onclick={Connect}
            disabled={isConnected}
            class="bg-blue-500 rounded-sm p-2 hover:bg-blue-400 text-white disabled:bg-blue-200"
        >
            Connect
        </button>
    </div>
    {#if isConnected}
        <div>
            <ChatInterface {socket} />
        </div>
    {/if}
</div>
