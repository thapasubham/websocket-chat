import { randomUUID } from "crypto";
import type { Server, Socket } from "socket.io";
import { redisIntance } from "../service/redis.service.js";
import { keyName } from "./redis.key.js";

interface Message {
  message: string;
  userName: string;
  roomID: string;
}

export class WebSocketController {
  private io: Server;
  private redisClient = redisIntance.getClient();
  constructor(io: Server) {
    this.io = io;

    this.io.on("connection", (socket: Socket) => {
      console.log("a user connected:", socket.id);

      socket.on("message", (data: Message) => {
        this.io.to(data.roomID).emit("message", data);
      });

      socket.on("find-room", () => {
        this.addtoQueue(socket);
      });

      socket.on("disconnect", () => {
        console.log("user disconnected:", socket.id);
      });
    });
  }

  async addtoQueue(socket: Socket) {
    const MAX_USERS = 2;

    const exists = await this.redisClient.lpos(keyName.matchmaking, socket.id);

    if (exists !== null) {
      return;
    }
    await this.redisClient.lpush(keyName.matchmaking, socket.id);

    const queueSize = await this.redisClient.llen(keyName.matchmaking);

    if (queueSize < MAX_USERS) {
      socket.emit(
        "queue-status",
        `Waiting for player... ${queueSize} in queue`,
      );
      return;
    }

    const users: string[] = [];
    const userSockets: Socket[] = [];

    for (let i = 0; i < MAX_USERS; i++) {
      const userId = await this.redisClient.lpop(keyName.matchmaking);

      if (!userId) {
        return;
      }

      const userSocket = this.io.sockets.sockets.get(userId);

      if (!userSocket) {
        continue;
      }

      users.push(userId);
      userSockets.push(userSocket);
    }

    if (userSockets.length < MAX_USERS) {
      return;
    }

    const roomID = `room:${randomUUID()}`;

    for (const socket of userSockets) {
      socket.join(roomID);

      socket.emit("room-found", {
        roomID,
        players: users,
      });
    }

    console.log("match created:", roomID);
  }
}
