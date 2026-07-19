import { createClient } from "redis";
import config from "../config.js";

const redisClient = createClient({ url: config.redisUrl });
redisClient.on("error", (error) => {
  console.error("Redis client error:", error);
});

// Add this
const sendCommand = redisClient.sendCommand.bind(redisClient);
redisClient.sendCommand = async (...args) => {
  return sendCommand(...args);
};

export async function connectRedis() {
  console.log("Connecting to Redis...");
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  return redisClient;
}

export default redisClient;
