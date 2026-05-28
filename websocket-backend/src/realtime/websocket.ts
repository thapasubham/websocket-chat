import { randomUUID } from "crypto";
import type { Server, Socket } from "socket.io";
import { redisIntance } from "../service/redis.service.js";
import { keyName } from "./redis.key.js";

interface Message {
  message: string;
  userName: string;
  roomID: string;
}

interface CanvasPayload {
  roomID: string;
  path: { x: number; y: number }[];
  color: string;
  brushSize: number;
}
const CHAT_MAX_USER = 5;
const DRAWING_MAX_USER = 2;
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

      socket.on("objectDrawn", (data: CanvasPayload) => {
        socket.to(data.roomID).emit("drawing-receive", data);
      });

      socket.on("find-room", () => {
        this.addtoQueue(socket, "chat", CHAT_MAX_USER);
      });

      socket.on("find-draw", () => {
        this.addtoQueue(socket, "drawing", DRAWING_MAX_USER);
      });

      socket.on("disconnect", async () => {
        console.log("user disconnected:", socket.id);
        await this.redisClient.lrem(
          `${keyName.matchmaking}:chat`,
          0,
          socket.id,
        );
        await this.redisClient.lrem(
          `${keyName.matchmaking}:drawing`,
          0,
          socket.id,
        );
      });
    });
  }

  async addtoQueue(socket: Socket, queueName: string, MAX_USERS: number) {
    const currentQueueKey = `${keyName.matchmaking}:${queueName}`;
    console.log("searching for match");
    const exists = await this.redisClient.lpos(currentQueueKey, socket.id);
    if (exists !== null) return;

    await this.redisClient.lpush(currentQueueKey, socket.id);
    const queueSize = await this.redisClient.llen(currentQueueKey);

    if (queueSize < MAX_USERS) {
      socket.emit(
        "queue-status",
        `Waiting for players... ${queueSize}/${MAX_USERS} in queue`,
      );
      return;
    }

    const multi = this.redisClient.multi();
    for (let i = 0; i < MAX_USERS; i++) {
      multi.rpop(currentQueueKey);
    }

    const results = await multi.exec();
    if (!results) return;

    const poppedUsers = results
      .map(([err, val]) => val as string)
      .filter(Boolean);

    const validSockets: Socket[] = [];
    const validUserIds: string[] = [];

    for (const userId of poppedUsers) {
      const userSocket = this.io.sockets.sockets.get(userId);
      if (userSocket) {
        validSockets.push(userSocket);
        validUserIds.push(userId);
      }
    }

    if (validSockets.length < MAX_USERS) {
      console.log(
        "Match failed due to stale sockets. Re-queuing remaining users.",
      );
      for (const survivor of validSockets) {
        await this.redisClient.lpush(currentQueueKey, survivor.id);
        survivor.emit("queue-status", "Matchmaking restarted... someone left.");
      }
      return;
    }

    const roomID = `${queueName}:${randomUUID()}`;

    for (const s of validSockets) {
      s.join(roomID);
      s.emit("room-found", {
        roomID,
        players: validUserIds,
      });
    }

    console.log(`Successfully created dynamic match [${queueName}]:`, roomID);
  }
}
