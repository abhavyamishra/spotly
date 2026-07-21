import { createClient } from "redis";
import config from "../config.js";

const redisClient = createClient({
  url: config.redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        return new Error("Redis reconnect failed");
      }
      return Math.min(retries * 100, 3000);
    },
  },
});

redisClient.on("connect", () => {
  console.log("Connecting to Redis...");
});

redisClient.on("ready", () => {
  console.log("Redis connected successfully.");
});

redisClient.on("reconnecting", () => {
  console.log("Reconnecting to Redis...");
});

redisClient.on("error", (error) => {
  console.error("Redis client error:", error);
});

// Preserve sendCommand for compatibility
const originalSendCommand = redisClient.sendCommand.bind(redisClient);

redisClient.sendCommand = (...args) => originalSendCommand(...args);

export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  return redisClient;
}

export default redisClient;