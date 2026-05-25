import { Redis } from "ioredis";

class RedisClient {
  private client: Redis;
  constructor() {
    this.client = new Redis({
      host: "localhost",
      port: 6379,
    });

    this.client.on("error", (err) => {
      console.error("Redis Client Error:", err);
    });

    this.client.on("connect", () => {
      console.log("Connected to Redis");
    });
  }
  async healthCheck(): Promise<boolean> {
    try {
      const pong = await this.client.ping();
      return pong === "PONG";
    } catch (err: unknown) {
      console.error("Redis health check failed:", err);
      return false;
    }
  }
  getClient() {
    return this.client;
  }
}

export const redisClient = new RedisClient();
