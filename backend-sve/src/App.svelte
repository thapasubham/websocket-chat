<script lang="ts">
    import { onMount } from "svelte";

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let drawing = false;

    onMount(() => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const context = canvas.getContext("2d");

        if (!context) return;

        ctx = context;

        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.strokeStyle = "white";
    });

    function startDrawing(e: MouseEvent) {
        if (e.button !== 0) return;

        drawing = true;

        const rect = canvas.getBoundingClientRect();

        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    }

    function draw(e: MouseEvent) {
        if (!drawing) return;

        const rect = canvas.getBoundingClientRect();

        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);

        ctx.stroke();
    }

    function stopDrawing() {
        drawing = false;
        ctx.closePath();
    }
</script>

<canvas
    bind:this={canvas}
    class="bg-zinc-900 cursor-crosshair"
    on:contextmenu={(e) => e.preventDefault()}
    on:mousedown={startDrawing}
    on:mousemove={draw}
    on:mouseup={stopDrawing}
>
</canvas>
