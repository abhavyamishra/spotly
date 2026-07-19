import { Router } from "express";
import {
  createRoom,
  listRooms,
  joinRoom,
  updateLocation,
  getNearbyRooms,
  getRoomMessages,
  postRoomMessage,
} from "../controllers/roomController.js";
import { attachUser, requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", attachUser, requireAuth, listRooms);
router.post("/create", attachUser, requireAuth, createRoom);
router.post("/join", attachUser, requireAuth, joinRoom);
router.post("/location", attachUser, requireAuth, updateLocation);
router.get("/nearby", attachUser, requireAuth, getNearbyRooms);
router.get("/:roomName/messages", attachUser, requireAuth, getRoomMessages);
router.post("/:roomName/messages", attachUser, requireAuth, postRoomMessage);

export default router;
