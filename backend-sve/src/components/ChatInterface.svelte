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
    interface message {
        message: string;
        userName: string;
        roomID: string;
        isMine?: boolean;
    }
    let userName = $state("");
    let messages = $state<message[]>([]);
    interface room_found {
        roomID: string;
        players: string[];
    }
    function sendMessage() {
        if (!socket || !roomId) return;

        if (!text.trim()) return;

        socket.emit("message", {
            message: text,
            userName: userName,
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

        const handleMessage = (data: message) => {
            messages = [
                ...messages,
                {
                    ...data,
                    isMine: data.userName === userName,
                },
            ];
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

<div
    class="flex flex-col h-full max-w-xl mx-auto p-4 gap-4 bg-zinc-950 text-white rounded-xl"
>
    <div
        class="flex flex-col gap-2 p-3 rounded-xl bg-zinc-900 border border-zinc-800 shadow-md"
    >
        <input
            disabled={isJoinedtoRoom || isWaiting}
            class="px-3 py-2 rounded-lg bg-zinc-800 text-sm outline-none border border-zinc-700 focus:border-emerald-500 disabled:opacity-50"
            placeholder="Enter username..."
            bind:value={userName}
            onkeydown={(e) => e.key === "Enter" && joinRoom()}
        />

        <button
            disabled={isWaiting || isJoinedtoRoom}
            class="px-3 py-2 rounded-lg text-sm font-medium transition
            bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-400"
            onclick={joinRoom}
        >
            {#if isWaiting}
                Searching for room...
            {:else if isJoinedtoRoom}
                Connected
            {:else}
                Find Room
            {/if}
        </button>
    </div>

    <div class="flex-1 overflow-y-auto flex flex-col gap-2 p-2">
        {#each messages as msg}
            <div class="flex {msg.isMine ? 'justify-end' : 'justify-start'}">
                <div
                    class={`max-w-[75%] px-3 py-2 rounded-2xl shadow-md border text-sm wrap-break-word
                    ${
                        msg.isMine
                            ? "bg-emerald-600 border-emerald-500 text-white"
                            : "bg-zinc-900 border-zinc-800 text-zinc-200"
                    }`}
                >
                    <div class="text-[10px] opacity-70 mb-1">
                        {msg.userName}
                    </div>
                    {msg.message}
                </div>
            </div>
        {/each}
    </div>

    <div class="flex gap-2 p-2 bg-zinc-900 border border-zinc-800 rounded-xl">
        <input
            disabled={!isJoinedtoRoom}
            class="flex-1 px-3 py-2 bg-zinc-800 text-sm rounded-lg outline-none border border-zinc-700 focus:border-blue-500 disabled:opacity-50"
            placeholder="Type a message..."
            bind:value={text}
            onkeydown={(e) => e.key === "Enter" && sendMessage()}
        />

        <button
            disabled={!isJoinedtoRoom}
            class="px-4 py-2 rounded-lg text-sm font-medium transition
            bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-400"
            onclick={sendMessage}
        >
            Send
        </button>
    </div>

    <UseToast {status} />
</div>
