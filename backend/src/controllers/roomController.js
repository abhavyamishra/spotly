import redisClient from "../services/redisService.js";
import { getNearbyUserIds } from "../services/roomService.js";
import { broadcastRoomsChanged } from "../ws.js";

const DISCOVERY_RADIUS_METERS = 2000;

function parseMessageEntries(entries) {
  return entries.map((entry) => ({
    id: entry.id,
    ...entry.message,
  }));
}

async function getRoomInfo(roomName) {
  const room = await redisClient.hGetAll(`room:${roomName}`);
  const meta = await redisClient.hGetAll(`room:meta:${roomName}`);

  if (!room || Object.keys(room).length === 0) {
    return null;
  }

  const membersCount = await redisClient.sCard(`room:members:${roomName}`);

  return {
    name: room.name,
    description: room.description,
    ownerId: room.ownerId,
    ownerUsername: room.ownerUsername,
    membersCount,
    pending: meta.pending === "true",
  };
}

export async function createRoom(req, res) {
  const { roomName, description, lat, lon,  allowPending = false } = req.body;
  const ownerId = req.user.userId.toString();
  if (!roomName) {
    return res.status(400).json({ error: "roomName is required" });
  }
  if (lat == null || lon == null) {
    return res.status(400).json({ error: "Location (lat/lon) is required to create a room" });
  }

  const roomKey = `room:${roomName}`;
  const exists = await redisClient.exists(roomKey);
  if (exists) {
    return res.status(409).json({ error: "Room already exists" });
  }

  const nearbyUsers = await getNearbyUserIds(lat, lon, DISCOVERY_RADIUS_METERS, 50);
  const otherUsers = nearbyUsers.filter((userId) => userId !== ownerId);

  if (otherUsers.length === 0 && !allowPending) {
    return res.status(400).json({ error: "No nearby users found; room creation stopped" });
  }

  await redisClient.hSet(roomKey, {
    name: roomName,
    description: description || "",
    ownerId,
    ownerUsername: req.user.username,
    createdAt: new Date().toISOString(),
  });

  await redisClient.hSet(`room:meta:${roomName}`, {
    creatorId: ownerId,
    lat: String(lat),
    lon: String(lon),
    pending: otherUsers.length === 0 ? "true" : "false",
    createdAt: new Date().toISOString(),
  });

  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

  await redisClient.zAdd("room:expirations", [
    {
      score: expiresAt,
      value: roomName,
    },
  ]);

  await redisClient.geoAdd("geo:rooms", {
    longitude: Number(lon),
    latitude: Number(lat),
    member: roomName,
  });

  await redisClient.sAdd(`room:members:${roomName}`, ownerId);

  if (description?.trim()) {
      await redisClient.xAdd(
        `room:messages:${roomName}`,
        "*",
      {
        userId: ownerId,
        username: req.user.username,
        avatar: req.user.avatar || "",
        text: description.trim(),
        createdAt: new Date().toISOString(),
        isQuestion: "true",
      }
    );
  }

  if (otherUsers.length > 0) {
    broadcastRoomsChanged({ action: "created", roomName });
    return res.status(201).json({ roomName, description, nearbyUsers: otherUsers.length });
  }

  broadcastRoomsChanged({ action: "created", roomName });
  return res.status(201).json({ roomName, description, pending: true, message: "Room created in pending mode; checking for nearby users." });
}

export async function listRooms(req, res) {
  const userId = req.user.userId.toString();
  const rooms = [];

  let cursor = 0;

  do {
    const { cursor: nextCursor, keys } = await redisClient.scan(cursor, {
      MATCH: "room:members:*",
      COUNT: 100,
    });

    cursor = Number(nextCursor);

    for (const key of keys) {
      const isMember = await redisClient.sIsMember(key, userId);
      if (!isMember) {
        continue;
      }

      const roomName = key.replace("room:members:", "");
      const info = await getRoomInfo(roomName);
      if (info?.name) {
        rooms.push(info);
      }
    }
  } while (cursor !== 0);

  return res.json({ rooms });
}

export async function joinRoom(req, res) {
  const { roomName } = req.body;
  const userId = req.user.userId.toString();
  if (!roomName) {
    return res.status(400).json({ error: "roomName is required" });
  }

  const roomKey = `room:${roomName}`;
  const exists = await redisClient.exists(roomKey);
  if (!exists) {
    return res.status(404).json({ error: "Room not found" });
  }

  await redisClient.sAdd(`room:members:${roomName}`, userId);
  broadcastRoomsChanged({ action: "joined", roomName });
  return res.json({ roomName, joined: true });
}

export async function getRoomMessages(req, res) {
  const { roomName } = req.params;
  const roomKey = `room:${roomName}`;

  const exists = await redisClient.exists(roomKey);
  if (!exists) {
    return res.status(404).json({ error: "Room not found" });
  }

  const entries = await redisClient.xRange(
    `room:messages:${roomName}`,
    "-",
    "+",
    { COUNT: 100 }
  );


  return res.json({
    messages: parseMessageEntries(entries),
  });
}
// export async function updateLocation(req, res) {
//   const { lat, lon } = req.body;
//   if (typeof lat !== "number" || typeof lon !== "number") {
//     return res.status(400).json({ error: "lat and lon must be numbers" });
//   }

//   await redisClient.geoAdd("geo:users", {
//     longitude: Number(lon),
//     latitude: Number(lat),
//     member: req.user.userId.toString(),
//   });
//   await redisClient.setEx(`user:online:${req.user.userId.toString()}`, 60, "1");

//   return res.json({ status: "location updated" });
// }
export async function updateLocation(req, res) {
  try {
    await redisClient.geoAdd("geo:users", {
      longitude: Number(req.body.lon),
      latitude: Number(req.body.lat),
      member: req.user.userId.toString(),
    });
    await redisClient.setEx(
      `user:online:${req.user.userId.toString()}`,
      60,
      "1"
    );

    return res.json({ status: "location updated" });
  } catch (err) {
    console.error("updateLocation failed");
    console.error(err);
    throw err;
  }
}

export async function getNearbyRooms(req, res) {
  const { lat, lon, count = 50 } = req.query;

  const parsedLat = Number(lat);
  const parsedLon = Number(lon);

  if (Number.isNaN(parsedLat) || Number.isNaN(parsedLon)) {
    return res.status(400).json({
      error: "lat and lon are required",
    });
  }

  let nearbyRooms;

  try {
    nearbyRooms = await redisClient.geoSearch(
      "geo:rooms",
      { longitude: parsedLon, latitude: parsedLat },
      {
        radius: DISCOVERY_RADIUS_METERS,
        unit: "m",
        count: Number(count),
      }
    );
  } catch {
    nearbyRooms = await redisClient.sendCommand([
      "GEORADIUS",
      "geo:rooms",
      parsedLon.toString(),
      parsedLat.toString(),
      String(DISCOVERY_RADIUS_METERS),
      "m",
      "COUNT",
      String(count),
    ]);
  }

  const rooms = [];

  for (const room of nearbyRooms || []) {
    const roomName = Array.isArray(room) ? room[0] : room;

    const info = await getRoomInfo(roomName);

    if (!info) continue;

    // Don't show rooms I'm already in
    const isMember = await redisClient.sIsMember(
      `room:members:${roomName}`,
      req.user.userId.toString()
    );

    if (isMember) continue;

    // Don't show my own room
    if (info.ownerId === req.user.userId.toString()) continue;

    rooms.push(info);
  }

  return res.json({ rooms });
}

export async function postRoomMessage(req, res) {
  const roomName = req.params.roomName || req.body.roomName;
  const { text } = req.body;
  const userId = req.user.userId.toString();
  if (!roomName || !text) {
    return res.status(400).json({ error: "roomName and text are required" });
  }

  const roomKey = `room:${roomName}`;
  const exists = await redisClient.exists(roomKey);
  if (!exists) {
    return res.status(404).json({ error: "Room not found" });
  }

  const messageId = await redisClient.xAdd(`room:messages:${roomName}`, "*", {
    userId,
    username: req.user.username,
    text,
    createdAt: new Date().toISOString(),
  });
  return res.status(201).json({ messageId });
}
