<script lang="ts">
    import type { Socket } from "socket.io-client";
    import { onMount } from "svelte";
    import UseToast from "../lib/UseToast.svelte";

    let { socket } = $props<{ socket: Socket }>();

    let text = $state("");
    let roomId = $state<string | null>(null);

    let isJoinedtoRoom = $state(false);
    let isWaiting = $state(false);

    let status = $state("");

    let messages = $state<string[]>([]);
    interface room_found {
        roomID: string;
        players: string[];
    }
    function sendMessage() {
        if (!socket || !roomId) return;

        if (!text.trim()) return;

        socket.emit("message", {
            message: text,
            roomID: roomId,
        });

        text = "";
    }

    function joinRoom() {
        if (!socket || isWaiting) return;

        isWaiting = true;

        socket.emit("find-room");
    }

    onMount(() => {
        if (!socket) return;

        const handleRoomFound = (data: room_found) => {
            console.log("Room found:", data);

            roomId = data.roomID;

            isJoinedtoRoom = true;
            isWaiting = false;

            status = "Match found!";
        };

        const handleWait = (data: string) => {
            status = data;
        };

        const handleMessage = (data: { message: string }) => {
            messages.push(data.message);
        };

        socket.on("room-found", handleRoomFound);

        socket.on("waiting:full", handleWait);

        socket.on("waiting:queue", handleWait);

        socket.on("message", handleMessage);

        return () => {
            socket.off("room-found", handleRoomFound);

            socket.off("waiting:full", handleWait);

            socket.off("waiting:queue", handleWait);

            socket.off("message", handleMessage);
        };
    });
</script>

<div class="grid gap-2 w-auto">
    <button
        disabled={isWaiting || isJoinedtoRoom}
        class="bg-blue-500 rounded-sm p-2 hover:bg-blue-400 text-white disabled:bg-blue-200"
        onclick={joinRoom}
    >
        {#if isWaiting}
            Searching...
        {:else if isJoinedtoRoom}
            Connected
        {:else}
            Find Room
        {/if}
    </button>

    <input
        disabled={!isJoinedtoRoom}
        class="bg-red-400 p-1 disabled:bg-gray-300"
        bind:value={text}
        onkeydown={(e) => e.key === "Enter" && sendMessage()}
    />

    <button
        disabled={!isJoinedtoRoom}
        class="bg-blue-500 rounded-sm p-2 hover:bg-blue-400 text-white disabled:bg-blue-200"
        onclick={sendMessage}
    >
        Send
    </button>

    {#if isJoinedtoRoom}
        <div class="text-green-500">
            Joined room: {roomId}
        </div>
    {/if}

    <UseToast {status} />

    <div class="flex flex-col gap-1">
        {#each messages as msg}
            <div class="bg-zinc-800 text-white p-2 rounded">
                {msg}
            </div>
        {/each}
    </div>
</div>
