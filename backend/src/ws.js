import { WebSocketServer } from "ws";
import { verifyToken } from "./services/authService.js";
import redisClient from "./services/redisService.js";
import config from "./config.js";
import { User } from "./models/User.js";

const wss = new WebSocketServer({ noServer: true });
const roomSockets = new Map();
const dashboardSockets = new Set();

function parseCookieValue(cookieString, name) {
  return cookieString?.split(";")
    .map((pair) => pair.trim())
    .find((pair) => pair.startsWith(`${name}=`))
    ?.split("=")[1];
}

async function publishJoinEvent(roomName, userId) {
  await redisClient.publish(`room:events:${roomName}`, JSON.stringify({ type: "join", userId, ts: Date.now() }));
}

wss.on("connection", (socket, request, user) => {
  socket.user = user;
  dashboardSockets.add(socket);
  socket.send(JSON.stringify({ type: "connected", user: { email: user.email, username: user.username, displayName: user.displayName } }));

  socket.on("message", async (data) => {
    try {
      const payload = JSON.parse(data.toString());
      if (payload.type === "subscribe" && payload.roomName) {
        const roomName = payload.roomName;
        const roomKey = `room:${roomName}`;
        const exists = await redisClient.exists(roomKey);
        if (!exists) {
          return socket.send(JSON.stringify({ type: "error", message: "Room not found" }));
        }

        socket.roomName = roomName;
        if (!roomSockets.has(roomName)) {
          roomSockets.set(roomName, new Set());
        }

        roomSockets.get(roomName).add(socket);
        await publishJoinEvent(roomName, user.userId);
        socket.send(JSON.stringify({ type: "subscribed", roomName }));
      }

      if (
        payload.type === "message" &&
        socket.roomName &&
        payload.text?.trim()
      )  {
        const roomName = socket.roomName;
        const createdAt= new Date().toISOString();
        const messageId = await redisClient.xAdd(
          `room:messages:${roomName}`,
          "*",
          {
            userId: user.userId,
            username: user.username,
            avatar: user.avatar || "",
            text: String(payload.text || ""),
            createdAt,
          }
        );

        const message = {
          id: messageId,
          userId: user.userId,
          username: user.username,
          avatar: user.avatar || "",
          text: payload.text,
          createdAt,
        };
        const clients = roomSockets.get(roomName);

        if (clients) {
          for (const client of clients) {
            if (client.readyState === client.OPEN) {
              client.send(
                JSON.stringify({
                  type: "message",
                  roomName,
                  message,
                })
              );
            }
          }
        }
      }
    } catch (error) {
      socket.send(JSON.stringify({ type: "error", message: "Invalid payload" }));
    }
  });

  socket.on("close", () => {
    dashboardSockets.delete(socket);

    if (socket.roomName && roomSockets.has(socket.roomName)) {
      const clients = roomSockets.get(socket.roomName);

      clients.delete(socket);

      if (clients.size === 0) {
        roomSockets.delete(socket.roomName);
      }
    }
  });
});

export function broadcastRoomsChanged(payload = {}) {
  const message = JSON.stringify({
    type: "rooms_changed",
    ...payload,
  });

  for (const client of dashboardSockets) {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  }
}

export default function attachWebsocketServer(server) {
  server.on("upgrade", async (request, socket, head) => {
    const token = parseCookieValue(request.headers.cookie, config.cookieName);
    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      socket.destroy();
      return;
    }
      const dbUser = await User.findById(payload.userId)
      .select("username displayName email avatar");
    const user = {
      userId: dbUser._id.toString(),
      username: dbUser.username,
      displayName: dbUser.displayName,
      email: dbUser.email,
      avatar: dbUser.avatar || "",
    };
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request, user);
    });
  });
}
