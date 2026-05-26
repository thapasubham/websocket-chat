<script lang="ts">
    import { io, Socket } from "socket.io-client";
    import UseToast from "./lib/UseToast.svelte";
    import ChatInterface from "./components/ChatInterface.svelte";

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
        socket = io("ws://localhost:5000");

        socket.on("connect", () => {
            isConnected = true;
            status = "Connected Successfully";

            console.log("Connected to websocket");
        });

        socket.on("disconnect", () => {
            isConnected = false;

            // prevent overwriting manual disconnect message
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
</script>

<div class="min-h-screen flex flex-col bg-zinc-950 text-white">
    <div
        class="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900"
    >
        <div class="flex items-center gap-3">
            <button
                data-testid="connect-btn"
                on:click={Connect}
                disabled={isConnected}
                class="px-4 py-2 rounded-lg text-sm font-medium transition
                bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-400"
            >
                {isConnected ? "Connected" : "Connect"}
            </button>

            <button
                data-testid="disconnect-btn"
                on:click={disconnect}
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

    <div class="flex-1 flex">
        {#if isConnected}
            <div data-testid="chat-interface" class="flex-1">
                <ChatInterface {socket} />
            </div>
        {:else}
            <div class="flex-1 flex items-center justify-center text-zinc-500">
                Click connect to start chatting
            </div>
        {/if}
    </div>
</div>
