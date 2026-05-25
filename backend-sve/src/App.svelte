<script lang="ts">
    import { io, Socket } from "socket.io-client";
    import { onMount } from "svelte";
    import UseToast from "./lib/UseToast.svelte";
    import ChatInterface from "./components/ChatInterface.svelte";
    let socket: Socket = $state<Socket>();
    let status = $state("");
    let isConnected = $state(false);

    function disconnect() {
        if (!socket) return;

        socket.disconnect();
        socket.removeAllListeners();

        isConnected = false;
        status = "Disconnected Successfully";
    }
    function Connect() {
        socket = io("ws://localhost:5000");

        socket.on("connect", () => {
            isConnected = true;
            status = "Connected Successfully";
            console.log("Connected to websocket:");
        });

        socket.on("disconnect", (data) => {
            status = "Failed to connect";

            isConnected = false;
        });
    }
    onMount(() => {});
</script>

<div class="min-h-screen flex flex-col bg-zinc-950 text-white">
    <div
        class="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900"
    >
        <div class="flex items-center gap-3">
            <button
                onclick={Connect}
                disabled={isConnected}
                class="px-4 py-2 rounded-lg text-sm font-medium transition
                bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-400"
            >
                {isConnected ? "Connected" : "Connect"}
            </button>
            <button
                onclick={disconnect}
                disabled={!isConnected}
                class="px-4 py-2 rounded-lg text-sm font-medium transition
                    bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-400"
            >
                {isConnected ? "Disonnect" : "Disconnected"}
            </button>
        </div>

        {#if status}
            <UseToast {status} />
        {/if}
    </div>

    <div class="flex-1 flex">
        {#if isConnected}
            <div class="flex-1">
                <ChatInterface {socket} />
            </div>
        {:else}
            <div class="flex-1 flex items-center justify-center text-zinc-500">
                Click connect to start chatting
            </div>
        {/if}
    </div>
</div>
