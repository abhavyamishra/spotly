import { Router } from "express";
import {
  requestOtp,
  signup,
  loginWithPassword,
  registerWithPassword,
  logout,
  currentUser,
  requestPasswordResetOtp,
  resetPassword,
  checkUsername,
  checkEmail,
} from "../controllers/authController.js";
import { attachUser, requireAuth } from "../middleware/authMiddleware.js";
import uploadAvatar from "../middleware/uploadAvatar.js";
import { updateAvatar } from "../controllers/authController.js";

const router = Router();

router.post("/otp/request", requestOtp);
router.post("/signup", signup);
router.post("/login", loginWithPassword);
router.post("/register", registerWithPassword);
router.post("/logout", attachUser, requireAuth, logout);
router.get("/me", attachUser, requireAuth, currentUser);
router.post(
    "/avatar",
    attachUser,
    uploadAvatar.single("avatar"),
    updateAvatar
);
router.post(
  "/forgot-password",
  requestPasswordResetOtp
);
router.post(
  "/reset-password",
  resetPassword
);
router.get("/check-username", checkUsername);
router.get("/check-email", checkEmail);

export default router;
