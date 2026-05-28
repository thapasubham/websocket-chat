<script lang="ts">
    import { io, Socket } from "socket.io-client";
    import UseToast from "./lib/UseToast.svelte";
    import ChatInterface from "./components/ChatInterface.svelte";
    import CanvasInterface from "./components/CanvasInterface.svelte";
    import { onMount } from "svelte";

    let socket: Socket;
    let status = $state("");
    let isConnected = $state(false);

    function disconnect() {
        if (!socket) return;

        status = "Disconnected Successfully";

        socket.disconnect();
        socket.removeAllListeners();

        isConnected = false;
    }

    function Connect() {
        const targetIP = window.location.hostname;

        socket = io(`ws://${targetIP}:5000`);

        socket.on("connect", () => {
            isConnected = true;
            status = "Connected Successfully";

            console.log("Connected to websocket");
        });

        socket.on("disconnect", () => {
            isConnected = false;

            if (status !== "Disconnected Successfully") {
                status = "Connection lost";
            }

            console.log("Disconnected from websocket");
        });

        socket.on("connect_error", (err) => {
            status = "Connection failed";
            console.error(err);
        });
    }
    onMount(() => {
        Connect();
    });
</script>

<div
    class="h-screen w-screen flex flex-col bg-zinc-950 text-white overflow-hidden"
>
    <div
        class="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900 shrink-0"
    >
        <div class="flex items-center gap-3">
            <button
                data-testid="connect-btn"
                onclick={Connect}
                disabled={isConnected}
                class="px-4 py-2 rounded-lg text-sm font-medium transition
                bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-400"
            >
                {isConnected ? "Connected" : "Connect"}
            </button>

            <button
                data-testid="disconnect-btn"
                onclick={disconnect}
                disabled={!isConnected}
                class="px-4 py-2 rounded-lg text-sm font-medium transition
                bg-red-600 hover:bg-red-500 disabled:bg-zinc-700 disabled:text-zinc-400"
            >
                {isConnected ? "Disconnect" : "Disconnected"}
            </button>
        </div>

        {#if status}
            <UseToast {status} />
        {/if}
    </div>

    <div class="flex-1 min-h-0 flex overflow-hidden">
        {#if isConnected}
            <div
                data-testid="chat-interface"
                class="flex-1 flex flex-col min-h-0 overflow-hidden"
            >
                <CanvasInterface {socket} />
            </div>
        {:else}
            <div class="flex-1 flex items-center justify-center text-zinc-500">
                Click connect to start
            </div>
        {/if}
    </div>
</div>
