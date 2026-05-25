import express from "express";
import { createServer } from "http";
import { WebSocketController } from "./realtime/websocket.js";
import { Server } from "socket.io";
import cors from "cors";
import { redisIntance } from "./service/redis.service.js";
import { createAdapter } from "@socket.io/redis-streams-adapter";

function startServer() {
  const app = express();
  const redisClient = redisIntance.getClient();
  app.use(
    cors({
      origin: "*",
    }),
  );
  const server = createServer(app);
  const io = new Server(server, {
    adapter: createAdapter(redisClient),
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });
  new WebSocketController(io);

  server.listen(5000, () => {
    console.log("Serving at http://localhost:5000");
  });
}

startServer();
