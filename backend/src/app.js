import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import config from "./config.js";
import { attachUser } from "./middleware/authMiddleware.js";
import { connectDb } from "./services/dbService.js";
import { connectRedis } from "./services/redisService.js";
import { startPendingRoomCleaner, startPresenceCleaner } from "./services/roomService.js";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
  })
);

app.use(attachUser);
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

await connectDb();
await connectRedis();

startPendingRoomCleaner();
startPresenceCleaner();

export default app;
