import type { Server, Socket } from "socket.io";

export class WebSocketController {
  private io: Server;

  constructor(io: Server) {
    this.io = io;

    this.io.on("connection", (socket: Socket) => {
      console.log("a user connected:", socket.id);

      socket.on("message", (data: string) => {
        console.log("message received:", data);

        this.io.emit("message", data);
      });

      socket.on("disconnect", () => {
        console.log("user disconnected:", socket.id);
      });

    });
  }
}
