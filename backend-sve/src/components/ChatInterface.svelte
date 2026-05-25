<script lang="ts">
    import type { Socket } from "socket.io-client";

    export let socket: Socket;
    let text: string = "";

    function sendMessage() {
        if (!socket) {
            console.log("Socket is empty");
            return;
        }
        if (!text.trim()) return;

        socket.emit("message", text);
        text = "";
    }
</script>

<div>
    <div>
        <input
            class="bg-red-400 p-1"
            bind:value={text}
            on:keydown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
            class="bg-blue-500 rounded-sm p-2 hover:bg-blue-400 text-white disabled:bg-blue-200"
            on:click={sendMessage}>Send</button
        >
    </div>
</div>
