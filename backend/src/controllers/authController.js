import crypto from "crypto";
import config from "../config.js";
import { User } from "../models/User.js";
import { hashPassword, verifyPassword, signToken } from "../services/authService.js";
import { sendOtp } from "../services/emailService.js";
import redisClient from "../services/redisService.js";
import cloudinary from "../services/cloudinaryService.js";
import streamifier from "streamifier";


const OTP_EXPIRY_SECONDS = 300;

function makeCookie(res, token) {
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: "lax",
    maxAge: config.accessTokenExpirySeconds * 1000,
  });
}

export async function requestOtp(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail });

  if (user) {
    return res.status(409).json({
      error: "User already exists. Please login.",
    });
  }

  const code = crypto.randomInt(100000, 999999).toString();

  await redisClient.set(`otp:${normalizedEmail}`, code, {
    EX: OTP_EXPIRY_SECONDS,
  });

  await sendOtp(normalizedEmail, code);

  return res.status(200).json({
    message: "OTP sent",
  });
}

export async function signup(req, res) {
  const { username, displayName, email, password, otp } = req.body;

  if (!username || !email || !password || !otp) {
    return res.status(400).json({
      error: "All fields are required",
    });
  }
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim().toLowerCase();
  if (normalizedUsername.length < 3) {
    return res.status(400).json({
      error: "Username must be at least 3 characters.",
    });
  }
  const normalizedDisplayName =
  displayName?.trim() || normalizedUsername;

  const storedOtp = await redisClient.get(`otp:${normalizedEmail}`);

  if (!storedOtp || storedOtp !== otp) {
    return res.status(401).json({
      error: "Invalid OTP",
    });
  }

  const existing = await User.findOne({
    email: normalizedEmail,
  });
  const existingUsername = await User.findOne({
    username: normalizedUsername,
  });

  if (existingUsername) {
    return res.status(409).json({
      error: "Username already taken.",
    });
  }

  if (existing) {
    return res.status(409).json({
      error: "User already exists",
    });
  }

  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    username: normalizedUsername,
    displayName: normalizedDisplayName,
    email: normalizedEmail,
    hashedPassword,
  });

  await redisClient.del(`otp:${normalizedEmail}`);

  const token = signToken({
    userId: user._id,
    email: user.email,
  });

  makeCookie(res, token);

  return res.json({
    message: "Signup successful",
    user: {
      userId: user._id.toString(),
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar || "",
      email: user.email,
    },
  });
}

export async function loginWithPassword(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = await User.findOne({ email: String(email).trim().toLowerCase() });
  if (!user || !(await verifyPassword(password, user.hashedPassword))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = signToken({ userId: user._id.toString(), email: user.email });
  makeCookie(res, token);
  return res.json({ message: "Logged in", user: { userId: user._id.toString(), email: user.email, username: user.username, avatar: user.avatar || "",
    displayName: user.displayName, } });
}

export async function registerWithPassword(req, res) {
  const {
    username,
    displayName,
    email,
    password,
  } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({ error: "User already exists" });
  }

  const normalizedUsername = username.trim().toLowerCase();

  const existingUsername = await User.findOne({
    username: normalizedUsername,
  });

  if (existingUsername) {
    return res.status(409).json({
      error: "Username already taken.",
    });
  }

  const hashedPassword = await hashPassword(password);
  const user = await User.create({
    username: normalizedUsername,
    displayName,
    email: normalizedEmail,
    hashedPassword,
  });
  const token = signToken({ userId: user._id.toString(), email: user.email });
  makeCookie(res, token);

  return res.status(201).json({ message: "Registered", user: { userId: user._id.toString(), email: user.email, username: user.username, avatar: user.avatar, displayName: user.displayName } });
}

export function logout(req, res) {
  res.clearCookie(config.cookieName, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: "lax",
  });
  return res.json({ message: "Logged out" });
}

export function currentUser(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  return res.json({ user: req.user });
}

export async function updateAvatar(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded.",
      });
    }
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "spotly/avatars",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });
    const user = await User.findById(req.user.userId);
    user.avatar = result.secure_url;
    await user.save();
    console.log("upload success");
    res.json({
      avatar: user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
}

export async function requestPasswordResetOtp(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return res.status(404).json({
      error: "No account found with this email",
    });
  }

  const code = crypto.randomInt(100000, 999999).toString();

  await redisClient.set(
    `reset-otp:${normalizedEmail}`,
    code,
    {
      EX: 300,
    }
  );

  await sendOtp(normalizedEmail, code);

  return res.json({
    message: "Password reset OTP sent",
  });
}

export async function resetPassword(req, res) {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({
      error: "Email, OTP and new password are required",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const storedOtp = await redisClient.get(
    `reset-otp:${normalizedEmail}`
  );

  if (!storedOtp || storedOtp !== otp) {
    return res.status(401).json({
      error: "Invalid or expired OTP",
    });
  }

  const user = await User.findOne({
    email: normalizedEmail,
  });

  if (!user) {
    return res.status(404).json({
      error: "User not found",
    });
  }

  user.hashedPassword = await hashPassword(newPassword);

  await user.save();

  await redisClient.del(
    `reset-otp:${normalizedEmail}`
  );

  return res.json({
    message: "Password reset successful",
  });
}

export async function checkUsername(req, res) {
  const username = String(req.query.username || "")
    .trim()
    .toLowerCase();

  if (username.length < 3) {
    return res.json({
      available: false,
      message: "Username must be at least 3 characters.",
    });
  }

  const existingUser = await User.findOne({ username });

  return res.json({
    available: !existingUser,
    message: existingUser
      ? "Username already taken."
      : "Username available.",
  });
}

export async function checkEmail(req, res) {
  const email = String(req.query.email || "")
    .trim()
    .toLowerCase();

  if (!email) {
    return res.json({
      available: false,
      message: "",
    });
  }

  const existingUser = await User.findOne({ email });

  return res.json({
    available: !existingUser,
    message: existingUser
      ? "Email already registered."
      : "Email available.",
  });
}