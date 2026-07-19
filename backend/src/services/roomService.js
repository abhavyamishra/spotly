import redisClient from "./redisService.js";
import { broadcastRoomsChanged } from "../ws.js";

const PENDING_CLEANUP_INTERVAL_MS = 30_000;
const OFFLINE_CLEANUP_INTERVAL_MS = 120_000;

function normalizeGeoResult(items) {
  if (!items) return [];
  return items.map((item) => (Array.isArray(item) ? item[0] : item));
}

export async function getNearbyUserIds(lat, lon, radius_m, count = 50) {
  try {
    const users = await redisClient.geoSearch(
      "geo:users",
      { longitude: Number(lon), latitude: Number(lat) },
      { radius: Number(radius_m), unit: "m", count: Number(count) }
    );
    return normalizeGeoResult(users);
  } catch (err) {
    const users = await redisClient.sendCommand([
      "GEORADIUS",
      "geo:users",
      Number(lon).toString(),
      Number(lat).toString(),
      Number(radius_m).toString(),
      "m",
      "COUNT",
      Number(count).toString(),
    ]);
    return normalizeGeoResult(users);
  }
}

export async function deleteRoom(roomName) {
  console.log("Deleting room:", roomName);
  await redisClient.del(`room:${roomName}`);
  await redisClient.del(`room:meta:${roomName}`);
  await redisClient.del(`room:members:${roomName}`);
  await redisClient.del(`room:messages:${roomName}`);
  await redisClient.zRem("geo:rooms", roomName);
  // Remove expiration entry
  await redisClient.zRem("room:expirations", roomName);
  broadcastRoomsChanged({
    action: "room_deleted",
    roomName,
  });
  console.log(`Room ${roomName} deleted.`);
}

export async function cleanupPendingRooms() {
  // 1. Get only rooms whose 24-hour expiry time has passed
  const expiredRooms = await redisClient.zRangeByScore(
    "room:expirations",
    0,
    Date.now()
  );

  // 2. Delete expired rooms
  for (const roomName of expiredRooms) {
    await deleteRoom(roomName);
    console.log(`Expired room ${roomName}`);
  }

  // 3. Scan remaining rooms only to check pending rooms
  for await (const key of redisClient.scanIterator({
    MATCH: "room:meta:*",
    COUNT: 100,
  })) {
    const meta = await redisClient.hGetAll(key);

    // Ignore active rooms
    if (meta.pending !== "true") {
      continue;
    }

    const roomName = key.replace("room:meta:", "");
    const creatorId = meta.creatorId;
    const lat = Number(meta.lat);
    const lon = Number(meta.lon);
    const radius = "2000";

    // Delete room if metadata is invalid
    if (
      !creatorId ||
      Number.isNaN(lat) ||
      Number.isNaN(lon)
    ) {
      await deleteRoom(roomName);
      continue;
    }

    // Find nearby users
    const nearbyUsers = await getNearbyUserIds(
      lat,
      lon,
      radius,
      50
    );

    // Exclude the room creator
    const filtered = nearbyUsers.filter(
      (userId) => userId !== creatorId
    );

    // Activate the room if another nearby user is found
    if (filtered.length > 0) {
      await redisClient.hSet(`room:meta:${roomName}`, {
        pending: "false",
      });

      broadcastRoomsChanged({
        action: "activated",
        roomName,
      });

      console.log(`Pending room ${roomName} is now active.`);
    }
  }
}

export async function cleanupOfflineUsers() {
  const userIds = await redisClient.zRange("geo:users", 0, -1);

  for (const userId of userIds) {
    const onlineKey = `user:online:${userId}`;
    const online = await redisClient.exists(onlineKey);
    if (!online) {
      await redisClient.zRem("geo:users", userId);
      console.log(`Removed stale geo location for offline user ${userId}`);
    }
  }
}

export function startPendingRoomCleaner() {
  console.log("Pending room cleaner started");
  setInterval(() => {
    cleanupPendingRooms().catch((error) => {
      console.error("Error cleaning pending rooms:", error);
    });
  }, PENDING_CLEANUP_INTERVAL_MS);
}

export function startPresenceCleaner() {
  setInterval(() => {
    cleanupOfflineUsers().catch((error) => {
      console.error("Error cleaning offline users:", error);
    });
  }, OFFLINE_CLEANUP_INTERVAL_MS);
}
