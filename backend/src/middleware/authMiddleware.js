import config from "../config.js";
import { verifyToken } from "../services/authService.js";
import { User } from "../models/User.js";

export async function attachUser(req, res, next) {
  const token = req.cookies?.[config.cookieName] || req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return next();
  }

  const payload = verifyToken(token);
  if (!payload || !payload.userId) {
    return next();
  }

  const user = await User.findById(payload.userId)
  .select("_id username displayName email roles avatar");
  if (!user) {
    return next();
  }

  req.user = {
    userId: user._id.toString(),
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    roles: user.roles,
    avatar: user.avatar || "",
  };
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}
