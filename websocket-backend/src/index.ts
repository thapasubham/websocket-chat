import express from "express";
import { createServer } from "http";
import { WebSocketController } from "./websocket/websocket.js";
import { Server } from "socket.io";
import cors from "cors";
import { redisClient } from "./client/redisClient.js";

function startServer() {
  const app = express();
  redisClient
    .healthCheck()
    .then(() => console.log("Connected to redis"))
    .catch(() => {
      console.log("Failed to connect to redis");
      process.exit(1);
    });
  app.use(
    cors({
      origin: "*",
    }),
  );
  const server = createServer(app);
  const io = new Server(server, {
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
