<script lang="ts">
    import { io, Socket } from "socket.io-client";
    import { onMount } from "svelte";
    import UseToast from "./lib/UseToast.svelte";
    import ChatInterface from "./components/ChatInterface.svelte";
    let socket: Socket = $state<Socket>();
    let status = $state("");
    let isConnected = $state(false);
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
