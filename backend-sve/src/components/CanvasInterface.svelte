<script lang="ts">
    import type { Socket } from "socket.io-client";
    import { onMount } from "svelte";

    let { socket } = $props<{ socket: Socket }>();
    const defaultColors = [
        "#000000",
        "#ef4444",
        "#f97316",
        "#eab308",
        "#22c55e",
        "#3b82f6",
        "#a855f7",
        "#ec4899",
    ];

    let canvas: HTMLCanvasElement;
    let container: HTMLDivElement;
    let ctx: CanvasRenderingContext2D | null = null;

    let userName = $state("");
    let currentRoomID = $state("");
    let isJoinedtoRoom = $state(false);
    let isWaiting = $state(false);

    let brushSize = $state(4);
    let currentColor = $state("#000000");
    let strokeHistory = $state<{ x: number; y: number }[]>([]);
    let isDrawing = $state(false);

    function resizeCanvas() {
        if (!canvas || !container) return;

        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.scale(dpr, dpr);
            ctx.lineWidth = brushSize;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.strokeStyle = currentColor;
        }
    }

    function sendData() {
        if (!isDrawing) return;
        isDrawing = false;

        if (strokeHistory.length > 0 && currentRoomID) {
            socket.emit("objectDrawn", {
                roomID: currentRoomID,
                path: strokeHistory,
                color: currentColor,
                size: brushSize,
            });
        }
    }

    function handleMouseDown(event: MouseEvent) {
        if (event.button !== 0 || !ctx || !isJoinedtoRoom) return;

        isDrawing = true;
        strokeHistory = [];
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = brushSize;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
        strokeHistory.push({ x, y });
    }

    function handleTouchStart(event: TouchEvent) {
        if (!ctx || !isJoinedtoRoom) return;

        event.preventDefault();
        isDrawing = true;
        strokeHistory = [];
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = brushSize;

        const rect = canvas.getBoundingClientRect();
        const touch = event.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
        strokeHistory.push({ x, y });
    }

    function handleTouchMove(event: TouchEvent) {
        if (!isDrawing || !ctx) return;

        event.preventDefault();

        const rect = canvas.getBoundingClientRect();
        const touch = event.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();

        strokeHistory.push({ x, y });
    }

    function handleMouseMove(event: MouseEvent) {
        if (!isDrawing || !ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();

        strokeHistory.push({ x, y });
    }

    function handleMouseLeave() {
        sendData();
    }

    function joinRoom() {
        if (!socket || isWaiting || !userName.trim()) return;
        isWaiting = true;

        socket.emit("find-draw");
    }

    function recieveDrawing(data: {
        path: { x: number; y: number }[];
        color: string;
        size: number;
    }) {
        if (!ctx || !data.path || data.path.length === 0) return;

        ctx.save();
        ctx.strokeStyle = data.color;
        ctx.lineWidth = data.size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();
        ctx.moveTo(data.path[0].x, data.path[0].y);
        for (let i = 1; i < data.path.length; i++) {
            ctx.lineTo(data.path[i].x, data.path[i].y);
        }
        ctx.stroke();
        ctx.restore();
    }

    onMount(() => {
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        socket.on("drawing-receive", recieveDrawing);

        socket.on(
            "room-found",
            (data: { roomID: string; players: string[] }) => {
                isWaiting = false;
                isJoinedtoRoom = true;
                currentRoomID = data.roomID;
            },
        );

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            socket.off("drawing-receive", recieveDrawing);
            socket.off("room-found");
        };
    });
</script>

<div
    bind:this={container}
    class="relative h-screen w-full bg-blue-200 overflow-hidden"
>
    <div
        class="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4"
    >
        {#if !isJoinedtoRoom}
            <div
                class="flex flex-col gap-2 p-3 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl"
            >
                <input
                    disabled={isJoinedtoRoom || isWaiting}
                    class="px-3 py-2 rounded-lg bg-zinc-800 text-sm text-white outline-none border border-zinc-700 focus:border-emerald-500 disabled:opacity-50"
                    placeholder="Enter username..."
                    bind:value={userName}
                    onkeydown={(e) => e.key === "Enter" && joinRoom()}
                />

                <button
                    disabled={isWaiting || isJoinedtoRoom || !userName.trim()}
                    class="px-3 py-2 rounded-lg text-sm font-medium text-white transition bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-400"
                    onclick={joinRoom}
                >
                    {#if isWaiting}
                        Searching for room...
                    {:else if isJoinedtoRoom}
                        Connected to Match
                    {:else}
                        Find Room
                    {/if}
                </button>
            </div>
        {/if}
    </div>

    <div
        class="absolute top-4 left-4 z-10 flex flex-col gap-2 rounded-xl bg-white p-3 shadow-xl border border-gray-100"
    >
        <span
            class="text-xs font-semibold text-gray-500 uppercase tracking-wider"
            >Palette</span
        >

        <div class="flex items-center gap-2">
            {#each defaultColors as color}
                <button
                    type="button"
                    class="h-6 w-6 rounded-sm border transition-transform duration-100 hover:scale-110 active:scale-95"
                    style="background-color: {color}; border-color: {currentColor ===
                    color
                        ? '#000000'
                        : 'transparent'};"
                    onclick={() => {
                        currentColor = color;
                        if (ctx) ctx.strokeStyle = color;
                    }}
                    aria-label="Select color {color}"
                ></button>
            {/each}

            <div class="h-6 w-px bg-gray-300 mx-1"></div>

            <div
                class="relative h-6 w-6 rounded-sm overflow-hidden border border-gray-200"
            >
                <input
                    type="color"
                    bind:value={currentColor}
                    oninput={() => {
                        if (ctx) ctx.strokeStyle = currentColor;
                    }}
                    class="absolute -inset-2 h-10 w-10 cursor-pointer border-0 p-0"
                />
            </div>
        </div>

        <div class="flex justify-between items-center mt-1">
            <span
                class="text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >Brush Size</span
            >
            <span class="text-xs font-bold text-gray-700">{brushSize}px</span>
        </div>
        <input
            type="range"
            min="1"
            max="40"
            step="1"
            bind:value={brushSize}
            aria-label="Select brush size {brushSize}"
            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
    </div>

    <canvas
        bind:this={canvas}
        onmousedown={handleMouseDown}
        onmousemove={handleMouseMove}
        onmouseup={sendData}
        onmouseleave={handleMouseLeave}
        ontouchstart={handleTouchStart}
        ontouchmove={handleTouchMove}
        ontouchend={sendData}
        ontouchcancel={sendData}
        class="block bg-white w-full h-full {isJoinedtoRoom
            ? 'cursor-crosshair'
            : 'cursor-not-allowed opacity-90'}"
    ></canvas>
</div>
